#!/usr/bin/env node
/**
 * Read-only diagnostic for the two legacy shop documents whose status writes
 * are rejected by validShop() because every post-update field is revalidated.
 *
 * Usage from the project root:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS='C:\\path\\to\\service-account.json'
 *   node scripts/inspect-shop-fields.mjs
 *   node scripts/inspect-shop-fields.mjs --shop=some-shop-id
 */

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_SHOP_IDS = ['22-27-cafe', '5NGl7VaM5gvb1NzhGnkK'];
const ALLOWED_FIELDS = [
  'name', 'ownerId', 'address', 'lat', 'lng', 'priceMin', 'priceMax',
  'hasWifi', 'tags', 'description', 'photos', 'hours', 'status', 'avgRating', 'reviewCount',
  'ratingCounts', 'viewCount',
];
const REQUIRED_FIELDS = [
  'name', 'ownerId', 'address', 'lat', 'lng', 'priceMin', 'priceMax',
  'hasWifi', 'tags', 'photos', 'hours', 'status', 'avgRating', 'reviewCount',
];
const VALID_TAGS = new Set([
  'Quiet', 'Study-Friendly', 'Airconditioned', 'Open 24/7', 'Nature', 'Cozy', 'Pet-Friendly',
  'Outdoor Seating', 'Free Parking', 'Vegan Options', 'Live Music', 'Power Outlets', 'Group-Friendly',
]);

function options(name) {
  return process.argv
    .filter((value) => value.startsWith(`${name}=`))
    .map((value) => value.slice(name.length + 1))
    .filter(Boolean);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validationProblems(data) {
  const problems = [];
  const number = (field, predicate = () => true) => {
    if (typeof data[field] !== 'number' || !Number.isFinite(data[field]) || !predicate(data[field])) problems.push(`${field}: must be a valid number`);
  };
  const integer = (field) => {
    if (!Number.isInteger(data[field]) || data[field] < 0) problems.push(`${field}: must be a non-negative integer`);
  };

  for (const field of REQUIRED_FIELDS) if (!(field in data)) problems.push(`${field}: missing required field`);
  if (typeof data.name !== 'string') problems.push('name: must be a string');
  if (typeof data.ownerId !== 'string') problems.push('ownerId: must be a string');
  if (typeof data.address !== 'string') problems.push('address: must be a string');
  number('lat');
  number('lng');
  number('priceMin', (value) => value >= 0);
  number('priceMax', (value) => value >= data.priceMin);
  if (typeof data.hasWifi !== 'boolean') problems.push('hasWifi: must be a boolean');
  if (!Array.isArray(data.tags) || data.tags.length > 6 || data.tags.some((tag) => !VALID_TAGS.has(tag))) problems.push('tags: must be a list of up to six allowed tags');
  if ('description' in data && (typeof data.description !== 'string' || data.description.length > 500)) problems.push('description: must be a string of at most 500 characters');
  if (!Array.isArray(data.photos)) problems.push('photos: must be a list');
  if (!isRecord(data.hours)) problems.push('hours: must be a map');
  if (!['pending', 'approved', 'rejected'].includes(data.status)) problems.push('status: must be pending, approved, or rejected');
  number('avgRating', (value) => value >= 0 && value <= 5);
  integer('reviewCount');
  if ('viewCount' in data) integer('viewCount');
  if ('ratingCounts' in data) {
    const counts = data.ratingCounts;
    const expected = ['1', '2', '3', '4', '5'];
    if (!isRecord(counts) || Object.keys(counts).sort().join(',') !== expected.join(',') || expected.some((rating) => !Number.isInteger(counts[rating]) || counts[rating] < 0)) {
      problems.push('ratingCounts: must contain exactly non-negative integer keys 1 through 5');
    }
  }
  return problems;
}

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase Admin SDK service-account key before running this read-only inspection.');
  }

  const ids = options('--shop');
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);
  for (const id of ids.length > 0 ? ids : DEFAULT_SHOP_IDS) {
    const snapshot = await db.collection('shops').doc(id).get();
    if (!snapshot.exists) {
      console.log(`shops/${id}: document not found`);
      continue;
    }
    const data = snapshot.data();
    const fields = Object.keys(data).sort();
    const missing = REQUIRED_FIELDS.filter((field) => !(field in data));
    const extraneous = fields.filter((field) => !ALLOWED_FIELDS.includes(field));
    const problems = validationProblems(data);
    console.log(`\nshops/${id}`);
    console.log(`  fields: ${fields.join(', ') || '(none)'}`);
    console.log(`  missing required: ${missing.join(', ') || '(none)'}`);
    console.log(`  extraneous: ${extraneous.join(', ') || '(none)'}`);
    console.log(`  other validShop violations: ${problems.filter((problem) => !problem.endsWith('missing required field')).join('; ') || '(none)'}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
