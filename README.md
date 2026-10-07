# Kapehan

Kapehan helps people discover and compare coffee shops in Tagum City. Customers can filter approved listings, save favorites, set search preferences, compare shops, track recently viewed spots, and leave one editable review per shop. Coffee-shop owners submit listings, follow approval status, receive in-app updates, and read customer reviews.

## Tech stack

- Expo SDK 57, Expo Router, React Native, and TypeScript
- NativeWind plus react-native-reusables style UI components
- Firebase Authentication and Cloud Firestore via the Firebase JavaScript SDK
- React Hook Form, Zod, Zustand, Dayjs, Cloudinary, and Expo Image Picker

## Getting started

### Requirements

- Node.js 22.13 or later (Expo SDK 57 minimum)
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled
- A Cloudinary cloud with an unsigned upload preset for listing photos

### Configure the project

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Fill in `.env`:
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBZDZHdDI-cNGNinlxMTDtFzZOy1dLhF3E
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=kapehan-app-4c616.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=kapehan-app-4c616
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=kapehan-app-4c616.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=722974004908
EXPO_PUBLIC_FIREBASE_APP_ID=1:722974004908:web:df32e157fa6df0ba6d3109
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=hoeyhawg
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=vfhwtfet

4. Start Expo:

   ```bash
   npx expo start
   ```

## Firestore rules and seed data

The checked-in rules live in `firestore.rules`. Deploy them only after populating existing shops with numeric `priceMin`/`priceMax` fields:

```bash
node --env-file=.env scripts/seed-shops.mjs --dry-run
node --env-file=.env scripts/seed-shops.mjs
npx firebase-tools login
npx firebase-tools deploy --only firestore --project "$env:EXPO_PUBLIC_FIREBASE_PROJECT_ID"
```

The seed script contains synthetic coordinates, prices, WiFi values, and ratings for demo data; replace them with verified shop information before presenting it as real.

## Validation

```bash
npx tsc --noEmit
npx expo lint
```

## Rules tests and deploying these changes

Run `npm run test:rules` with Java installed. This uses `@firebase/rules-unit-testing` 5.x (Firebase 12 compatible) and starts only the local Firestore emulator under `demo-kapehan`. The tests refuse non-local emulator hosts and cover history, photos, reports, atomic review removal, and existing review/listing writes. No production credentials are needed. The CLI is invoked through `npx firebase-tools`; it is not installed globally.

After reviewing the rules diff and passing the tests, deploy explicitly to your intended project:

```bash
npm run test:rules
npx firebase-tools deploy --only firestore --project <id>
```

The app changes require these rules before history writes, review photo writes, reports, or review removal will work in that project. No new composite index is required: reports use a single `createdAt` ordering or equality-only sibling queries. Legacy listings without `ratingCounts` need a reviewed repair via `scripts/backfill-shop-fields.mjs` before moderation; this task does not run repairs or deploy.

See [the paper-gap validation and device QA guide](docs/paper-gap-validation.md) for acceptance checks, privacy/documentation updates, and moderation limits.

## Windows troubleshooting

- OneDrive can delay Metro file watching. If refreshes are unreliable, keep an active development checkout outside a synced folder and copy or commit changes afterward.
- If startup or scanning is unusually slow, add a Windows Defender exclusion for the project directory and its `node_modules` folder according to your organization’s security policy.
- Expo Go needs to reach Metro. Use the LAN connection on the same network first; if that is blocked, start with `npx expo start --tunnel`.
- When a device shows old code, stop Expo, run `npx expo start --clear`, and reopen the QR URL.
