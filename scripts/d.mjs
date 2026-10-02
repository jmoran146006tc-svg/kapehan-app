/**
 * Removes Firestore data for users whose Auth account no longer exists:
 * the users doc (plus notifications), each shop's followers entry and review
 * for that uid, then recomputes affected shops' avgRating, reviewCount and
 * ratingCounts. Never deletes shops; shops owned by a deleted user are only
 * reported.
 *
 *   $env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\service-account.json'
 *   node scripts/purge-orphans.mjs
 *   node scripts/purge-orphans.mjs --apply --project=kapehan-app-4c616
 */

import { existsSync, readFileSync } from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const option = (name) => process.argv.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS first.');
const projectId = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')).project_id;
if (apply && option('--project') !== projectId) throw new Error(`Pass --project=${projectId} to confirm.`);

const ratingsPath = new URL('./shop-ratings.json', import.meta.url);
const googleRatings = existsSync(ratingsPath) ? JSON.parse(readFileSync(ratingsPath, 'utf8')) : {};

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);
const auth = getAuth(app);

// 1. Every uid that still exists in Auth
const liveUids = new Set();
let pageToken;
do {
  const page = await auth.listUsers(1000, pageToken);
  page.users.forEach((u) => liveUids.add(u.uid));
  pageToken = page.pageToken;
} while (pageToken);

// 2. Orphaned profile docs
const userDocs = (await db.collection('users').get()).docs;
const orphans = userDocs.filter((d) => !liveUids.has(d.id));
console.log(`${liveUids.size} live Auth accounts, ${userDocs.length} user docs, ${orphans.length} orphaned.\n`);
for (const o of orphans) console.log(`  orphan: ${o.id} (${o.data().email ?? 'no email'}, ${o.data().role})`);

// 3. Read all reviews and followers once instead of two reads per shop per orphan
const shops = (await db.collection('shops').get()).docs;
const orphanIds = new Set(orphans.map((o) => o.id));
const allReviews = (await db.collectionGroup('reviews').get()).docs;
const allFollowers = (await db.collectionGroup('followers').get()).docs;
const orphanReviews = allReviews.filter((d) => orphanIds.has(d.id));
const orphanFollowers = allFollowers.filter((d) => orphanIds.has(d.id));

for (const shop of shops) {
  if (orphanIds.has(shop.data().ownerId)) console.log(`  ! shop ${shop.id} is owned by deleted user ${shop.data().ownerId} (not deleted)`);
}
for (const d of orphanReviews) console.log(`  review: ${d.ref.path}`);
console.log(`  ${orphanFollowers.length} orphaned follower record(s)`);

if (!apply) { console.log('\nNo writes made. Re-run with --apply --project=<id>.'); process.exit(0); }

const writer = db.bulkWriter();
for (const d of [...orphanReviews, ...orphanFollowers]) writer.delete(d.ref);
await writer.close();

// 4. Recompute aggregates for affected shops (and any shop whose count is out of sync)
const orphanPaths = new Set(orphanReviews.map((d) => d.ref.path));
const touchedIds = new Set(orphanReviews.map((d) => d.ref.parent.parent.id));
const remainingByShop = new Map();
for (const d of allReviews) {
  if (orphanPaths.has(d.ref.path)) continue;
  const shopId = d.ref.parent.parent.id;
  if (!remainingByShop.has(shopId)) remainingByShop.set(shopId, []);
  remainingByShop.get(shopId).push(d.data().rating);
}
for (const shop of shops) {
  const ratings = remainingByShop.get(shop.id) ?? [];
  if (!touchedIds.has(shop.id) && ratings.length === (shop.data().reviewCount ?? 0)) continue;
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => { ratingCounts[r] += 1; });
  const avgRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
    : googleRatings[shop.id]?.avgRating ?? 0;
  await shop.ref.update({ reviewCount: ratings.length, ratingCounts, avgRating });
  console.log(`  recomputed ${shop.id}: ${ratings.length} reviews, avg ${avgRating}`);
}

for (const o of orphans) await db.recursiveDelete(o.ref);
console.log(`\nDone. Removed ${orphans.length} user docs.`);