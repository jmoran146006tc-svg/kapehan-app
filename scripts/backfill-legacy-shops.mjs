#!/usr/bin/env node
/**
 * Previews and, only with --apply, repairs the legacy /shops fields that
 * prevent the current validShop() Firestore rule from accepting a status write.
 *
 * This script never invents prices. Supply reviewed fallback values if a shop
 * has no usable numeric priceMin/priceMax values.
 *
 * Usage from the project root:
 *   node --env-file=.env scripts/backfill-legacy-shops.mjs
 *   node --env-file=.env scripts/backfill-legacy-shops.mjs --apply --price-min=60 --price-max=150
 */

import { initializeApp } from 'firebase/app';
import { collection, deleteField, doc, getDocs, getFirestore, writeBatch } from 'firebase/firestore';

const RETIRED_FIELDS = ['wifiRating', 'noiseLevel', 'ambianceTags', 'priceRange', 'tagline'];
const MAX_BATCH_WRITES = 450;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function option(name) {
  const argument = process.argv.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1);
}

function nonNegativeNumber(value) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function reviewedFallbackPrices() {
  const priceMin = nonNegativeNumber(option('--price-min'));
  const priceMax = nonNegativeNumber(option('--price-max'));

  if (priceMin === null && priceMax === null) return null;
  if (priceMin === null || priceMax === null || priceMax < priceMin) {
    throw new Error('Provide non-negative --price-min and --price-max values, with price-max greater than or equal to price-min.');
  }
  return { priceMin, priceMax };
}

function buildUpdate(data, fallbackPrices) {
  const update = {};
  const removedFields = RETIRED_FIELDS.filter((field) => field in data);
  for (const field of removedFields) update[field] = deleteField();

  const currentMin = nonNegativeNumber(data.priceMin);
  const currentMax = nonNegativeNumber(data.priceMax);
  const validPriceRange = currentMin !== null && currentMax !== null && currentMax >= currentMin;
  const needsPriceBackfill = !validPriceRange;

  if (needsPriceBackfill && fallbackPrices) {
    if (currentMin !== null && currentMax === null) {
      update.priceMax = Math.max(currentMin, fallbackPrices.priceMax);
    } else if (currentMin === null && currentMax !== null) {
      update.priceMin = Math.min(fallbackPrices.priceMin, currentMax);
    } else {
      update.priceMin = fallbackPrices.priceMin;
      update.priceMax = fallbackPrices.priceMax;
    }
  }

  return { update, removedFields, needsPriceBackfill };
}

async function commitInBatches(db, plans) {
  for (let index = 0; index < plans.length; index += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    for (const plan of plans.slice(index, index + MAX_BATCH_WRITES)) {
      batch.update(doc(db, 'shops', plan.id), plan.update);
    }
    await batch.commit();
  }
}

async function main() {
  if (!firebaseConfig.projectId) {
    throw new Error('Missing Firebase config. Run with your environment file loaded, for example: node --env-file=.env scripts/backfill-legacy-shops.mjs');
  }

  const apply = process.argv.includes('--apply');
  const fallbackPrices = reviewedFallbackPrices();
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const snapshot = await getDocs(collection(db, 'shops'));
  const plans = snapshot.docs.map((shop) => {
    const { update, removedFields, needsPriceBackfill } = buildUpdate(shop.data(), fallbackPrices);
    return { id: shop.id, update, removedFields, needsPriceBackfill };
  }).filter((plan) => Object.keys(plan.update).length > 0 || plan.needsPriceBackfill);

  console.log(`${apply ? 'Applying' : 'Previewing'} legacy-schema repairs for ${plans.length} of ${snapshot.size} shops in ${firebaseConfig.projectId}.`);
  for (const plan of plans) {
    const changes = [
      plan.removedFields.length ? `remove ${plan.removedFields.join(', ')}` : null,
      plan.needsPriceBackfill ? (fallbackPrices ? 'backfill priceMin/priceMax' : 'priceMin/priceMax needs reviewed fallback values') : null,
    ].filter(Boolean);
    console.log(`  shops/${plan.id}: ${changes.join('; ')}`);
  }

  const blockedByPriceReview = plans.some((plan) => plan.needsPriceBackfill) && !fallbackPrices;
  if (blockedByPriceReview) {
    console.log('\nNo writes were made. Review each affected listing, then rerun with --apply and reviewed --price-min/--price-max values.');
    return;
  }

  const writePlans = plans.filter((plan) => Object.keys(plan.update).length > 0);
  if (!apply) {
    console.log('\nNo writes were made. Add --apply only after a human has reviewed this preview.');
    return;
  }

  await commitInBatches(db, writePlans);
  console.log(`\nUpdated ${writePlans.length} shops. Verify the data before deploying firestore.rules.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
