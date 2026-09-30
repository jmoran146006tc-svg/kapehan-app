// scripts/backfill-user-profiles.mjs
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const list = (name) => (process.argv.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1) ?? '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const admins = new Set(list('--admins'));
const owners = new Set(list('--owners'));

function roleFor(email = '') {
  const e = email.toLowerCase();
  if (admins.has(e) || /admin/.test(e)) return 'admin';
  if (owners.has(e) || /owner/.test(e)) return 'owner';
  return 'user';
}

const app = getApps()[0] ?? initializeApp({ credential: applicationDefault() });
const auth = getAuth(app);
const db = getFirestore(app);

const authUsers = [];
let page = await auth.listUsers(1000);
authUsers.push(...page.users);
while (page.pageToken) {
  page = await auth.listUsers(1000, page.pageToken);
  authUsers.push(...page.users);
}

const existing = new Set((await db.collection('users').select().get()).docs.map((d) => d.id));
const missing = authUsers.filter((u) => !existing.has(u.uid));

console.log(`${apply ? 'Creating' : 'Previewing'} ${missing.length} profiles.`);
for (const u of missing) {
  const role = roleFor(u.email);
  const name = u.displayName || u.email?.split('@')[0] || 'Kapehan user';
  console.log(`  ${u.email} -> role=${role}, name="${name}"`);
  if (!apply) continue;
  await db.doc(`users/${u.uid}`).create({
    name, email: u.email ?? '', role, status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    agreedToTermsAt: FieldValue.serverTimestamp(),
    preferences: {}, savedShopIds: [], recentlyViewed: [], visitCount: 0,
  });
}
if (!apply) console.log('\nNo writes made. Re-run with --apply to create them.');