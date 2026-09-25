#!/usr/bin/env node
/**
 * Wipes every top-level Firestore collection and its subcollections using the
 * Admin SDK, which bypasses firestore.rules entirely.
 *
 * This is destructive and irreversible. There is no dry-run flag beyond the
 * counts printed below — read them before passing --yes.
 *
 * This does NOT touch Firebase Authentication accounts. Anyone who was
 * signed in can still log in afterward; useAuth() will auto-recreate a
 * blank "user"-role profile doc for them on next load (see the repair
 * logic in src/hooks/useAuth.ts). Admin accounts are provisioned outside
 * the client app on purpose, so after a reset you'll need to manually set
 * role: "admin" again on that account's /users/{uid} doc — it will not
 * come back on its own.
 *
 * Usage from the project root:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\service-account.json'
 *   node scripts/reset-database.mjs            # preview counts only
 *   node scripts/reset-database.mjs --yes --project=YOUR_PROJECT_ID
 *                                           # actually deletes everything
 */

import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase Admin SDK service-account key before running this script.'
    );
  }

  const confirmed = process.argv.includes('--yes');
  const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  const projectId = serviceAccount.project_id;
  if (serviceAccount.type !== 'service_account' || !projectId) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS must point to a Firebase service-account key.');
  }
  const targetProject = process.argv.find((argument) => argument.startsWith('--project='))?.slice('--project='.length);
  if (confirmed && targetProject !== projectId) {
    throw new Error(`To wipe this database, pass --project=${projectId} alongside --yes.`);
  }

  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore(app);

  console.log(`Firestore reset for project "${projectId}"`);

  const collections = await db.listCollections();
  for (const collection of collections) {
    const snapshot = await collection.count().get();
    console.log(`  ${collection.id}: ${snapshot.data().count} top-level document(s) (subcollections included in the wipe)`);
  }

  if (!confirmed) {
    console.log('\nNo changes made. Re-run with --yes to permanently delete all of the above.');
    return;
  }

  for (const collection of collections) {
    console.log(`Deleting ${collection.id}...`);
    await db.recursiveDelete(collection);
  }

  console.log('\nDone. Firestore is empty.');
  console.log('Re-run scripts/seed-shops.mjs for demo shops.');
  console.log('Remember to manually set role: "admin" on your admin account\'s /users/{uid} doc — it does not survive the wipe.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
