#!/usr/bin/env node
/**
 * Preview existing saved shops that lack shop-scoped follower records.
 * Uses Admin SDK credentials. Run with --apply only after reviewing the count.
 */
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const projectId = process.argv.find((arg) => arg.startsWith('--project='))?.slice('--project='.length);
if (!projectId) throw new Error('Provide the verified Firebase project ID with --project=<id>.');
const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);
const users = await db.collection('users').get();
const plans = [];

for (const user of users.docs) {
  const ids = Array.isArray(user.data().savedShopIds) ? [...new Set(user.data().savedShopIds)] : [];
  for (const shopId of ids) {
    if (typeof shopId !== 'string' || !shopId) continue;
    const shop = await db.doc(`shops/${shopId}`).get();
    if (!shop.exists) continue;
    const follower = db.doc(`shops/${shopId}/followers/${user.id}`);
    if (!(await follower.get()).exists) plans.push(follower);
  }
}

console.log(`${apply ? 'Applying' : 'Previewing'} ${plans.length} missing follower records from ${users.size} users in ${projectId}.`);
if (apply) {
  for (let index = 0; index < plans.length; index += 450) {
    const batch = db.batch();
    for (const follower of plans.slice(index, index + 450)) batch.set(follower, { createdAt: FieldValue.serverTimestamp() });
    await batch.commit();
  }
  console.log('Done. Run again without --apply to verify zero missing records.');
}
