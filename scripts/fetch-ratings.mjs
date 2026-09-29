#!/usr/bin/env node
/**
 * Read Google Maps ratings through the official Places API (New).
 * Writes only scripts/shop-ratings.json; never connects to Firestore.
 *
 * Authentication: set GOOGLE_PLACES_API_KEY, or set
 * GOOGLE_APPLICATION_CREDENTIALS to a service account with Places API access
 * and the Service Usage Consumer role on its billing project.
 *
 * node scripts/fetch-ratings.mjs --dry-run
 * node scripts/fetch-ratings.mjs --limit=5
 * node scripts/fetch-ratings.mjs --only=dusk-coffee,11-11-cafe
 * node scripts/fetch-ratings.mjs
 *
 * A run that fails partway leaves shop-ratings.json untouched. A limited run
 * updates only those shops, retaining existing entries for the rest.
 */

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault } from 'firebase-admin/app';
import { SHOPS, slugify } from './seed-real-shops.mjs';

const MAX_DISTANCE_M = 150;
const ADDRESS_DISTANCE_M = 250;
const OUTPUT = fileURLToPath(new URL('./shop-ratings.json', import.meta.url));
// Listing-title variants checked against the same Tagum pin/address on 2026-09-30.
// These still have to pass the distance and city checks below.
const NAME_ALIASES = {
  'caffeine-jitters-co': ['Caffeine Jitters'],
  'neimar-s-cafe': ['Neimar’s Cafe - Apokon Road'],
  'martha-s-coffee-house': ["Martha's Coffe House"],
  '22-27-korean-cafe': ['22.27 Cafe'],
  'mabeani-cafe-and-restaurant': ['Mabeani'],
  'tea-barrel-tagum': ['Tea Barrel Tagum - Jose Abad Santos'],
  'blugre-coffee-tagum': ['Blugre Coffee Weekly Market Tagum'],
  annipie: ['Annipie - Robinsons Tagum'],
  starbucks: ['Starbucks Tagum Drive-Thru'],
};
const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.rating',
  'places.businessStatus', 'places.googleMapsUri',
].join(',');

function option(name) {
  return process.argv.find((arg) => arg.startsWith(name + '='))?.slice(name.length + 1);
}

function checkedAt() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return value.year + '-' + value.month + '-' + value.day;
}

function distanceM(lat1, lng1, lat2, lng2) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = radians(lat2 - lat1);
  const lngDelta = radians(lng2 - lng1);
  const a = Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(lngDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizedName(name) {
  return slugify(name.normalize('NFKD')).replace(/-tagum(?:-city)?$/, '');
}

export function selectMatch(shop, places) {
  const ranked = places.filter((place) =>
    Number.isFinite(place.location?.latitude) &&
    Number.isFinite(place.location?.longitude) &&
    typeof place.displayName?.text === 'string'
  ).map((place) => ({
    ...place,
    meters: distanceM(shop.lat, shop.lng, place.location.latitude, place.location.longitude),
  })).sort((a, b) => a.meters - b.meters);

  const plusCode = shop.address.match(/\b[23456789CFGHJMPQRVWX]{4}\+[23456789CFGHJMPQRVWX]{2,3}\b/i)?.[0];
  const nearby = ranked.filter((place) =>
    place.meters <= MAX_DISTANCE_M ||
    (place.meters <= ADDRESS_DISTANCE_M &&
      plusCode && place.formattedAddress?.toUpperCase().includes(plusCode.toUpperCase()))
  );
  const acceptedNames = [shop.name, ...(NAME_ALIASES[slugify(shop.name)] ?? [])]
    .map(normalizedName);
  const named = nearby.filter((place) =>
    acceptedNames.includes(normalizedName(place.displayName.text))
  );
  const matched = named.filter((place) => /\btagum\b/i.test(place.formattedAddress ?? ''));

  if (matched.length === 1) return { kind: 'match', place: matched[0] };
  if (matched.length > 1 || named.length > 0) {
    return { kind: 'ambiguous', candidates: named };
  }
  return { kind: 'noMatch', nearest: ranked[0] };
}

async function authorizationHeaders() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (key) return { 'X-Goog-Api-Key': key };

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('Set GOOGLE_PLACES_API_KEY or GOOGLE_APPLICATION_CREDENTIALS.');
  }
  const projectId = JSON.parse(readFileSync(credentialsPath, 'utf8')).project_id;
  if (!projectId) throw new Error('The service account has no project_id.');
  const token = await applicationDefault().getAccessToken();
  return {
    Authorization: 'Bearer ' + token.access_token,
    'X-Goog-User-Project': projectId,
  };
}

async function lookup(shop, authHeaders) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: shop.name + ' Tagum City',
      maxResultCount: 5,
      locationBias: {
        circle: {
          center: { latitude: shop.lat, longitude: shop.lng },
          radius: 500,
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Places API ' + response.status + ': ' +
      (data.error?.status ?? 'UNKNOWN') + ' ' + (data.error?.message ?? ''));
  }
  return data.places ?? [];
}

async function main() {
  const limit = Number(option('--limit') ?? SHOPS.length);
  if (!Number.isInteger(limit) || limit < 1 || limit > SHOPS.length) {
    throw new Error('--limit must be an integer from 1 to ' + SHOPS.length + '.');
  }
  const only = option('--only')?.split(',').filter(Boolean);
  if (only && option('--limit')) throw new Error('Use --only or --limit, not both.');
  const knownSlugs = new Set(SHOPS.map((shop) => slugify(shop.name)));
  if (only?.some((slug) => !knownSlugs.has(slug))) {
    throw new Error('--only contains an unknown shop slug.');
  }
  const selected = only
    ? SHOPS.filter((shop) => only.includes(slugify(shop.name)))
    : SHOPS.slice(0, limit);
  if (!selected.length) throw new Error('--only requires at least one shop slug.');
  if (process.argv.includes('--dry-run')) {
    console.log('Dry run: ' + selected.length + ' shops; no API calls or file writes.');
    for (const shop of selected) console.log(slugify(shop.name) + ' | ' + shop.name + ' | ' + shop.address);
    return;
  }

  const authHeaders = await authorizationHeaders();
  const ratings = selected.length === SHOPS.length || !existsSync(OUTPUT)
    ? {}
    : JSON.parse(readFileSync(OUTPUT, 'utf8'));
  for (const rating of Object.values(ratings)) {
    delete rating.reviewCount;
    delete rating.ratingCounts;
  }
  const report = { rated: [], noRating: [], noMatch: [], ambiguous: [], closed: [] };
  const date = checkedAt();

  for (const shop of selected) {
    const slug = slugify(shop.name);
    delete ratings[slug];
    const result = selectMatch(shop, await lookup(shop, authHeaders));
    if (result.kind === 'noMatch') {
      const nearest = result.nearest;
      report.noMatch.push(shop.name + ' (nearest: ' +
        (nearest ? nearest.displayName.text + ' | ' + nearest.formattedAddress + ' | ' +
          Math.round(nearest.meters) + ' m | ' + (nearest.googleMapsUri ?? nearest.id) : 'none') + ')');
    } else if (result.kind === 'ambiguous') {
      report.ambiguous.push(shop.name + ' (' + result.candidates.map((place) =>
        place.displayName.text + ' at ' + place.formattedAddress + ', ' +
        Math.round(place.meters) + ' m').join('; ') + ')');
    } else {
      const place = result.place;
      if (place.businessStatus && place.businessStatus !== 'OPERATIONAL') {
        report.closed.push(shop.name + ' -> ' + place.businessStatus);
      }
      if (typeof place.rating !== 'number' || place.rating <= 0 || place.rating > 5) {
        report.noRating.push(shop.name);
      } else {
        ratings[slug] = {
          avgRating: Number(place.rating.toFixed(1)),
          source: 'Google Maps',
          checkedAt: date,
        };
        report.rated.push(shop.name + ' -> ' + place.displayName.text + ' | ' +
          place.formattedAddress + ' | ' + place.rating + ' stars | ' +
          Math.round(place.meters) + ' m | ' +
          (place.googleMapsUri ?? place.id));
      }
    }
    await new Promise((done) => setTimeout(done, 150));
  }

  const temporary = OUTPUT + '.tmp-' + process.pid;
  writeFileSync(temporary, JSON.stringify(ratings, null, 2) + '\n');
  renameSync(temporary, OUTPUT);
  for (const [category, entries] of Object.entries(report)) {
    console.log('\n' + category + ' (' + entries.length + '):');
    for (const entry of entries) console.log('  ' + entry);
  }
  console.log('\nWrote ' + OUTPUT + '. Shops without a Google rating still need a Facebook review check.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
