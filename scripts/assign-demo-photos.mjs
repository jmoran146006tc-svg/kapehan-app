#!/usr/bin/env node
/**
 * Preview photo assignments for seed-script shops with no photos.
 * Nothing is written unless --apply and --project=<id> are both provided.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const projectId = process.argv.find((arg) => arg.startsWith('--project='))?.slice('--project='.length);
if (apply && !projectId) throw new Error('Applying changes requires --project=<id>.');
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to the service-account JSON path first.');
}

const photos = JSON.parse(readFileSync(new URL('./demo-photos.json', import.meta.url), 'utf8'));
if (!Array.isArray(photos) || photos.length < 3 || photos.some((url) => typeof url !== 'string' || !/^https:\/\//.test(url))) {
  throw new Error('demo-photos.json must be an array with at least three HTTPS photo URLs.');
}
if (new Set(photos).size !== photos.length) throw new Error('demo-photos.json contains duplicate URLs.');

const app = initializeApp({ credential: applicationDefault(), ...(projectId ? { projectId } : {}) });
const db = getFirestore(app);
const snapshot = await db.collection('shops').where('ownerId', '==', 'seed-script').get();
const plans = [];

for (const shop of snapshot.docs) {
  const data = shop.data();
  if (data.ownerId !== 'seed-script') continue;
  if (Array.isArray(data.photos) && data.photos.length > 0) continue;
  const hash = createHash('sha256').update(shop.id).digest();
  const start = hash.readUInt32BE(0) % photos.length;
  const indexes = [0, 1, 2].map((offset) => (start + offset) % photos.length);
  plans.push({ ref: shop.ref, indexes, urls: indexes.map((index) => photos[index]) });
}

console.log(`${apply ? 'Applying' : 'Previewing'} demo photos for ${plans.length} of ${snapshot.size} seed-script shops in ${projectId ?? app.options.projectId ?? 'the credential project'}.`);
console.log(`Input: ${photos.length} distinct URLs; each selected shop receives three distinct URLs.`);
for (const plan of plans.slice(0, 8)) {
  console.log(`  ${plan.ref.id}: photo indexes ${plan.indexes.join(', ')}`);
}
if (plans.length > 8) console.log(`  ...and ${plans.length - 8} more shops`);

if (apply) {
  for (let index = 0; index < plans.length; index += 450) {
    const batch = db.batch();
    for (const plan of plans.slice(index, index + 450)) batch.update(plan.ref, { photos: plan.urls });
    await batch.commit();
  }
  console.log('Done. Run again without --apply to verify zero eligible shops remain.');
} else {
  console.log('Preview only. Re-run with --project=<id> --apply to assign photos.');
}
