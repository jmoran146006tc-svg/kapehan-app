#!/usr/bin/env node
/**
 * Previews and, only with --apply, repairs fields required by the current
 * /shops Firestore schema. This uses an Admin SDK service account because the
 * production client rules intentionally do not permit arbitrary legacy repair.
 *
 * Usage from the project root:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS='C:\\path\\to\\service-account.json'
 *   node scripts/backfill-shop-fields.mjs
 *   node scripts/backfill-shop-fields.mjs --shop=22-27-cafe --shop=5NGl7VaM5gvb1NzhGnkK
 *   node scripts/backfill-shop-fields.mjs --shop=22-27-cafe --apply --price-min=60 --price-max=150
 *
 * Reviewed fallback prices are required only for shops with an invalid or
 * missing price range. The script never guesses a real shop's pricing.
 */

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const MAX_BATCH_WRITES = 450;
const ZERO_RATING_COUNTS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
const ALLOWED_SHOP_FIELDS = new Set([
  'name', 'ownerId', 'address', 'lat', 'lng', 'priceMin', 'priceMax',
  'hasWifi', 'tags', 'description', 'photos', 'hours', 'status', 'avgRating', 'reviewCount',
  'ratingCounts', 'viewCount',
]);

function option(name) {
  const argument = process.argv.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1);
}

function options(name) {
  return process.argv
    .filter((value) => value.startsWith(`${name}=`))
    .map((value) => value.slice(name.length + 1))
    .filter(Boolean);
}

function validPrice(value) {
  const price = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function fallbackPrices() {
  const priceMin = validPrice(option('--price-min'));
  const priceMax = validPrice(option('--price-max'));

  if (priceMin === null && priceMax === null) return null;
  if (priceMin === null || priceMax === null || priceMax < priceMin) {
    throw new Error('Provide reviewed non-negative --price-min and --price-max values, with price-max greater than or equal to price-min.');
  }
  return { priceMin, priceMax };
}

function hasRatingCounts(value) {
  return value && typeof value === 'object' && [1, 2, 3, 4, 5].every((rating) =>
    Number.isInteger(value[rating]) && value[rating] >= 0,
  );
}

function validPriceRange(data) {
  const priceMin = validPrice(data.priceMin);
  const priceMax = validPrice(data.priceMax);
  return priceMin !== null && priceMax !== null && priceMax >= priceMin;
}

function buildPlan(data, reviewedPrices) {
  const update = {};
  const changes = [];

  for (const field of Object.keys(data)) {
    if (!ALLOWED_SHOP_FIELDS.has(field)) {
      update[field] = FieldValue.delete();
      changes.push(`${field}: removed`);
    }
  }

  if (!Number.isInteger(data.viewCount) || data.viewCount < 0) {
    update.viewCount = 0;
    changes.push('viewCount: 0');
  }
  if (!hasRatingCounts(data.ratingCounts)) {
    update.ratingCounts = ZERO_RATING_COUNTS;
    changes.push('ratingCounts: zeroed');
  }
  if (!validPriceRange(data)) {
    if (!reviewedPrices) return { update, changes, needsPriceReview: true };
    update.priceMin = reviewedPrices.priceMin;
    update.priceMax = reviewedPrices.priceMax;
    changes.push(`priceMin/priceMax: ₱${reviewedPrices.priceMin}/₱${reviewedPrices.priceMax}`);
  }

  return { update, changes, needsPriceReview: false };
}

async function commitInBatches(db, plans) {
  for (let start = 0; start < plans.length; start += MAX_BATCH_WRITES) {
    const batch = db.batch();
    for (const plan of plans.slice(start, start + MAX_BATCH_WRITES)) {
      batch.update(db.collection('shops').doc(plan.id), plan.update);
    }
    await batch.commit();
  }
}

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase Admin SDK service-account key before running this script.');
  }

  const reviewedPrices = fallbackPrices();
  const apply = process.argv.includes('--apply');
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() });
  const db = getFirestore(app);
  const requestedIds = options('--shop');
  const snapshot = requestedIds.length === 0 ? await db.collection('shops').get() : null;
  const requestedShops = requestedIds.length === 0
    ? snapshot.docs
    : await Promise.all(requestedIds.map((id) => db.collection('shops').doc(id).get()));
  const missingIds = requestedShops.filter((shop) => !shop.exists).map((shop) => shop.id);
  if (missingIds.length > 0) {
    throw new Error(`Could not find: ${missingIds.map((id) => `shops/${id}`).join(', ')}.`);
  }
  const plans = requestedShops.map((shop) => ({ id: shop.id, ...buildPlan(shop.data(), reviewedPrices) }))
    .filter((plan) => plan.changes.length > 0 || plan.needsPriceReview);

  console.log(`${apply ? 'Applying' : 'Previewing'} schema repairs for ${plans.length} of ${requestedShops.length} shops.`);
  for (const plan of plans) {
    console.log(`  shops/${plan.id}: ${plan.needsPriceReview ? 'priceMin/priceMax need reviewed fallback values' : plan.changes.join('; ')}`);
  }

  if (plans.some((plan) => plan.needsPriceReview)) {
    console.log('\nNo writes were made. Review each affected shop, then rerun with --price-min and --price-max.');
    return;
  }
  if (!apply) {
    console.log('\nNo writes were made. Add --apply only after a human has reviewed this preview.');
    return;
  }

  const writePlans = plans.filter((plan) => plan.changes.length > 0);
  await commitInBatches(db, writePlans);
  console.log(`\nUpdated ${writePlans.length} shops. Deploy firestore.rules after verifying the repaired documents.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
