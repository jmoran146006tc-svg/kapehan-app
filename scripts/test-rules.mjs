import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';

// Refuse to run against a real Firebase project or a remote host.
const address = process.env.FIRESTORE_EMULATOR_HOST;
if (!address || !/^(127\.0\.0\.1|localhost):\d+$/.test(address)) throw new Error('Run with npm run test:rules against the local Firestore emulator.');
const [host, port] = address.split(':');
let env;
const counts = { '1': 0, '2': 0, '3': 1, '4': 0, '5': 1 };
const photos = [1, 2, 3].map((n) => `https://res.cloudinary.com/demo/image/upload/review-${n}.jpg`);
const now = Timestamp.fromMillis(1000);
const shopData = { name: 'Test Coffee', ownerId: 'owner', address: 'Apokon', lat: 7.4, lng: 125.8, priceMin: 80, priceMax: 150, hasWifi: true, tags: [], photos: [], hours: {}, status: 'approved', avgRating: 4, reviewCount: 2, ratingCounts: counts };
const dbFor = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.test` }).firestore();

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-kapehan', firestore: { host, port: Number(port), rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = writeBatch(db);
    for (const [uid, role] of [['admin', 'admin'], ['owner', 'owner'], ['customerA', 'user'], ['customerB', 'user'], ['customerC', 'user']]) {
      batch.set(doc(db, 'users', uid), { name: uid, email: `${uid}@example.test`, role, status: 'active', reviewCount: uid === 'customerA' || uid === 'customerB' ? 1 : 0 });
    }
    batch.set(doc(db, 'shops', 'coffee'), shopData);
    const { ratingCounts: omitted, ...legacy } = shopData;
    void omitted;
    batch.set(doc(db, 'shops', 'legacy'), legacy);
    for (const shopId of ['coffee', 'legacy']) {
      for (const [uid, rating] of [['customerA', 5], ['customerB', 3]]) batch.set(doc(db, 'shops', shopId, 'reviews', uid), { userId: uid, userName: uid, rating, text: 'Coffee review', createdAt: now });
    }
    await batch.commit();
  });
});

test('History: owner accepts 10 entries; rejects 11, non-list, and another user', async () => {
  const db = dbFor('customerA');
  const ref = doc(db, 'users', 'customerA');
  await assertSucceeds(updateDoc(ref, { recentSearches: Array(10).fill('apokon') }));
  await assertFails(updateDoc(ref, { recentSearches: Array(11).fill('apokon') }));
  await assertFails(updateDoc(ref, { recentSearches: 'apokon' }));
  await assertFails(updateDoc(doc(dbFor('customerB'), 'users', 'customerA'), { recentSearches: [] }));
  await assertSucceeds(updateDoc(ref, { recentSearches: [] }));
});

test('History: optional on account creation and validated when supplied', async () => {
  const db = dbFor('newUser');
  const data = { name: 'New user', email: 'newUser@example.test', role: 'user', status: 'active', createdAt: serverTimestamp(), agreedToTermsAt: serverTimestamp(), preferences: {}, savedShopIds: [], recentlyViewed: [] };
  await assertFails(setDoc(doc(db, 'users', 'newUser'), { ...data, recentSearches: Array(11).fill('coffee') }));
  await assertSucceeds(setDoc(doc(db, 'users', 'newUser'), data));
});

function createReviewWithPhotos(value, extra = {}) {
  const db = dbFor('customerC');
  const batch = writeBatch(db);
  batch.set(doc(db, 'shops', 'coffee', 'reviews', 'customerC'), { userId: 'customerC', userName: 'Customer C', rating: 4, text: '', photos: value, createdAt: serverTimestamp(), ...extra });
  batch.update(doc(db, 'shops', 'coffee'), { reviewCount: 3, avgRating: 4, ratingCounts: { ...counts, '4': 1 } });
  return batch.commit();
}
test('Photos: create with three Cloudinary URLs', async () => { await assertSucceeds(createReviewWithPhotos(photos)); });
for (const [label, value] of [['four URLs', [...photos, photos[0]]], ['external URL', ['https://example.test/a.jpg']], ['non-string', [7]], ['long URL', ['https://res.cloudinary.com/' + 'x'.repeat(500)]]]) {
  test(`Photos: reject ${label}`, async () => { await assertFails(createReviewWithPhotos(value)); });
}
test('Photos: reject unknown review field', async () => { await assertFails(createReviewWithPhotos(photos, { extra: true })); });
test('Photos: author can add, empty, and remove field; owner can still reply', async () => {
  const db = dbFor('customerA');
  const ref = doc(db, 'shops', 'coffee', 'reviews', 'customerA');
  await assertSucceeds(updateDoc(ref, { photos, editedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(dbFor('owner'), 'shops', 'coffee', 'reviews', 'customerA'), { ownerReply: { text: 'Thanks', repliedAt: serverTimestamp() } }));
  await assertSucceeds(updateDoc(ref, { photos: [], editedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ref, { photos: deleteField(), editedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(dbFor('owner'), 'shops', 'coffee', 'reviews', 'customerA'), { photos: [] }));
});

function removalNotification(shopId = 'coffee') {
  return { type: 'review_removed', message: 'Your review was removed.', shopId, read: false, createdAt: serverTimestamp() };
}

// Exercise all reads and all four writes together, including the access-call budget.
async function removeReview(db, uid) {
  return runTransaction(db, async (tx) => {
    const shopRef = doc(db, 'shops', 'coffee');
    const reviewRef = doc(db, 'shops', 'coffee', 'reviews', uid);
    const userRef = doc(db, 'users', uid);
    const shop = (await tx.get(shopRef)).data();
    const review = (await tx.get(reviewRef)).data();
    const profile = (await tx.get(userRef)).data();
    const ratingCounts = { ...shop.ratingCounts, [String(review.rating)]: shop.ratingCounts[String(review.rating)] - 1 };
    const reviewCount = shop.reviewCount - 1;
    tx.delete(reviewRef);
    tx.update(shopRef, { reviewCount, ratingCounts, avgRating: reviewCount ? (shop.avgRating * shop.reviewCount - review.rating) / reviewCount : 0 });
    tx.update(userRef, { reviewCount: profile.reviewCount - 1 });
    tx.set(doc(collection(db, 'users', uid, 'notifications')), removalNotification());
  });
}
test('Moderation: complete admin transaction succeeds within access-call budget and last removal resets average', async () => {
  const db = dbFor('admin');
  await assertSucceeds(removeReview(db, 'customerA'));
  assert.equal((await getDoc(doc(db, 'shops', 'coffee', 'reviews', 'customerA'))).exists(), false);
  const shop = (await getDoc(doc(db, 'shops', 'coffee'))).data();
  assert.equal(shop.reviewCount, 1);
  assert.equal(shop.avgRating, 3);
  assert.equal(shop.ratingCounts['5'], 0);
  assert.equal((await getDoc(doc(db, 'users', 'customerA'))).data().reviewCount, 0);
  const notices = await getDocs(collection(dbFor('customerA'), 'users', 'customerA', 'notifications'));
  assert.equal(notices.size, 1);
  assert.equal(notices.docs[0].data().type, 'review_removed');
  await assertSucceeds(removeReview(db, 'customerB'));
  assert.equal((await getDoc(doc(db, 'shops', 'coffee'))).data().avgRating, 0);
  assert.equal((await getDoc(doc(db, 'shops', 'coffee'))).data().reviewCount, 0);
});
for (const uid of ['owner', 'customerA', 'customerB']) test(`Moderation: ${uid} cannot delete a review`, async () => { await assertFails(deleteDoc(doc(dbFor(uid), 'shops', 'coffee', 'reviews', 'customerA'))); });
test('Moderation: admin delete alone is denied', async () => { await assertFails(deleteDoc(doc(dbFor('admin'), 'shops', 'coffee', 'reviews', 'customerA'))); });
for (const [label, changes, shopId] of [
  ['wrong bucket', { reviewCount: 1, avgRating: 5, ratingCounts: { ...counts, '3': 0 } }, 'coffee'],
  ['wrong count', { reviewCount: 0, avgRating: 0, ratingCounts: { ...counts, '5': 0 } }, 'coffee'],
  ['wrong average', { reviewCount: 1, avgRating: 4, ratingCounts: { ...counts, '5': 0 } }, 'coffee'],
  ['legacy data', { reviewCount: 1, avgRating: 3 }, 'legacy'],
]) test(`Moderation: reject ${label}`, async () => {
  const db = dbFor('admin'); const batch = writeBatch(db);
  batch.delete(doc(db, 'shops', shopId, 'reviews', 'customerA'));
  batch.update(doc(db, 'shops', shopId), changes);
  await assertFails(batch.commit());
});
test('Moderation: removal notification requires admin and simultaneous deletion', async () => {
  for (const uid of ['customerB', 'admin']) await assertFails(setDoc(doc(dbFor(uid), 'users', 'customerA', 'notifications', 'invalid'), removalNotification()));
});

const reportId = 'customerB__review__coffee__customerA';
function newReport(overrides = {}) { return { targetType: 'review', shopId: 'coffee', shopName: 'Test Coffee', reviewId: 'customerA', targetUserId: 'customerA', reporterId: 'customerB', reason: 'spam', status: 'open', createdAt: serverTimestamp(), ...overrides }; }
function resolveData(status = 'actioned') { return { status, resolvedAt: serverTimestamp(), resolvedBy: 'admin' }; }
test('Reports: deterministic creation, own get, admin list and resolve, duplicates denied', async () => {
  const db = dbFor('customerB'); const ref = doc(db, 'reports', reportId);
  await assertSucceeds(getDoc(ref)); // Missing report must be readable for duplicate detection.
  await assertSucceeds(setDoc(ref, newReport()));
  await assertSucceeds(getDoc(ref));
  await assertFails(setDoc(ref, newReport()));
  await assertFails(getDoc(doc(dbFor('customerA'), 'reports', reportId)));
  await assertSucceeds(getDocs(collection(dbFor('admin'), 'reports')));
  await assertFails(getDocs(collection(db, 'reports')));
  await assertFails(updateDoc(ref, { ...resolveData(), resolvedBy: 'customerB' }));
  await assertSucceeds(updateDoc(doc(dbFor('admin'), 'reports', reportId), resolveData()));
  await assertFails(updateDoc(doc(dbFor('admin'), 'reports', reportId), resolveData('dismissed')));
});
test('Reports: listing creation uses owner and approved status', async () => {
  const { reviewId: omitted, ...listing } = newReport({ targetType: 'listing', targetUserId: 'owner', reason: 'incorrect_info' });
  void omitted;
  await assertSucceeds(setDoc(doc(dbFor('customerB'), 'reports', 'customerB__listing__coffee'), listing));
  await assertFails(setDoc(doc(dbFor('owner'), 'reports', 'owner__listing__coffee'), { ...listing, reporterId: 'owner' }));
  await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'shops', 'coffee'), { status: 'pending' }));
  await assertFails(setDoc(doc(dbFor('customerA'), 'reports', 'customerA__listing__coffee'), { ...listing, reporterId: 'customerA' }));
});
for (const [label, overrides, id] of [
  ['wrong id', {}, 'bad-id'], ['spoofed reporter', { reporterId: 'customerA' }], ['self target', { targetUserId: 'customerB', reviewId: 'customerB' }, 'customerB__review__coffee__customerB'],
  ['unknown reason', { reason: 'whatever' }], ['long details', { details: 'x'.repeat(301) }], ['extra field', { private: true }], ['resolved on create', { status: 'actioned' }], ['spoofed author', { targetUserId: 'owner' }],
]) test(`Reports: reject ${label}`, async () => { await assertFails(setDoc(doc(dbFor('customerB'), 'reports', id ?? reportId), newReport(overrides))); });
test('Reports: admin cannot change target content or reporter on resolution', async () => {
  await setDoc(doc(dbFor('customerB'), 'reports', reportId), newReport());
  const ref = doc(dbFor('admin'), 'reports', reportId);
  for (const changes of [{ reason: 'other' }, { reporterId: 'admin' }, { details: 'edited' }]) await assertFails(updateDoc(ref, { ...resolveData(), ...changes }));
});
test('Reports: resolve sibling reports in a separate 10-write batch', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const batch = writeBatch(ctx.firestore());
    for (let i = 0; i < 10; i++) batch.set(doc(ctx.firestore(), 'reports', `report-${i}`), { ...newReport(), createdAt: now });
    await batch.commit();
  });
  const db = dbFor('admin');
  await assertSucceeds(removeReview(db, 'customerA'));
  const reports = await getDocs(query(collection(db, 'reports'), where('targetType', '==', 'review'), where('shopId', '==', 'coffee'), where('reviewId', '==', 'customerA'), where('status', '==', 'open')));
  assert.equal(reports.size, 10);
  const batch = writeBatch(db);
  reports.forEach((report) => batch.update(report.ref, resolveData()));
  await assertSucceeds(batch.commit());
});

test('Regression: complete customer create/edit transaction with photos, aggregates, profile and owner notification', async () => {
  const db = dbFor('customerC');
  const create = writeBatch(db);
  create.set(doc(db, 'shops', 'coffee', 'reviews', 'customerC'), { userId: 'customerC', userName: 'C', rating: 4, text: '', photos, createdAt: serverTimestamp() });
  create.update(doc(db, 'shops', 'coffee'), { reviewCount: 3, avgRating: 4, ratingCounts: { ...counts, '4': 1 } });
  create.update(doc(db, 'users', 'customerC'), { reviewCount: 1 });
  create.set(doc(db, 'users', 'owner', 'notifications', 'create'), { type: 'review_received', message: 'New review', shopId: 'coffee', read: false, createdAt: serverTimestamp() });
  await assertSucceeds(create.commit());
  const edit = writeBatch(db);
  edit.update(doc(db, 'shops', 'coffee', 'reviews', 'customerC'), { rating: 5, photos: [], editedAt: serverTimestamp() });
  edit.update(doc(db, 'shops', 'coffee'), { reviewCount: 3, avgRating: 13 / 3, ratingCounts: { ...counts, '5': 2 } });
  edit.set(doc(db, 'users', 'owner', 'notifications', 'edit'), { type: 'review_received', message: 'Edited review', shopId: 'coffee', read: false, createdAt: serverTimestamp() });
  await assertSucceeds(edit.commit());
});

test('Regression: owner listing edits and admin status decisions still succeed', async () => {
  await assertSucceeds(updateDoc(doc(dbFor('owner'), 'shops', 'coffee'), { status: 'pending', description: 'Updated listing' }));
  const db = dbFor('admin'); const batch = writeBatch(db);
  batch.update(doc(db, 'shops', 'coffee'), { status: 'approved' });
  batch.set(doc(db, 'users', 'owner', 'notifications', 'approval'), { type: 'listing_approved', message: 'Approved', shopId: 'coffee', read: false, createdAt: serverTimestamp() });
  await assertSucceeds(batch.commit());
});
