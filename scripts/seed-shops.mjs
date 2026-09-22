#!/usr/bin/env node
/**
 * scripts/seed-shops.mjs
 *
 * Seeds /shops in Firestore from the Tagum coffee-shop research list.
 *
 * WHAT THIS DOES
 * - Writes one doc per shop to the `shops` collection, matching the
 *   current schema (priceMin/priceMax + hasWifi — noiseLevel/ambianceTags
 *   were cut from the ER diagram, so they are NOT written here).
 * - Sets status: "approved" directly, skipping the owner-submit ->
 *   admin-approve flow, since this is seed/test data, not a real
 *   owner-created listing.
 *
 * WHAT'S REAL vs PLACEHOLDER
 * - name: real, taken straight from your list.
 * - address / lat / lng: SYNTHETIC. address is a generic Tagum City
 *   string, and lat/lng are jittered around the city center so pins
 *   spread out on a map -- they do NOT point at the shop's real
 *   location. Replace with real geocoded data before your demo.
 * - prices / hasWifi / avgRating / reviewCount: deterministic
 *   fake values (seeded from the shop name, so re-running this script
 *   always produces the same numbers) purely so search/sort/compare
 *   have something to work with. Not real ratings.
 * - ownerId: a placeholder string, not a real Firebase Auth uid.
 *
 * PREREQUISITES
 * - Firestore rules still open ("test mode") -- this script uses the
 *   same public client config as the app itself, no admin credentials.
 * - Node 20.6+ (for --env-file). Your project already requires this.
 *
 * USAGE (run from the project root)
 *   node --env-file=.env scripts/seed-shops.mjs --dry-run   # preview only
 *   node --env-file=.env scripts/seed-shops.mjs             # write everything
 *   node --env-file=.env scripts/seed-shops.mjs --limit=20  # write just the first 20
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, serverTimestamp, setDoc } from "firebase/firestore";

// ---------------------------------------------------------------------------
// 1. The list (order preserved from your notes)
// ---------------------------------------------------------------------------

const SHOP_NAMES = [
  "Drip",
  "Kofi badi",
  "Kanoffee",
  "Coffee maybe",
  "Bean O'clock",
  "Mikos brew",
  "Rookie",
  "Kapekol",
  "Foto cafe",
  "Dens cafe",
  "Cuptains brew",
  "Dear coffee",
  "Pick up coffee",
  "Nicchiatto",
  "Little baker",
  "Breakfast club",
  "Cove cafe",
  "Psalms cafe",
  "22.27 cafe",
  "Coffee takeaway",
  "Ryokuo cafe",
  "Wall side",
  "Kuan cafe",
  "Kurahi",
  "Blugre cafe",
  "Hola",
  "Mabeani",
  "High Ground cafe",
  "Lattétude coffee house",
  "Starbucks",
  "Royale's coffee",
  "Coffee keeper",
  "Sip & Savor street brews",
  "Mike Café",
  "Clubhaus",
  "Kape tayo?",
  "Tanaman arts cafe",
  "Doze coffee club",
  "Riley's Boulangerine & Cat Cafe",
  "Kafe Snowball",
  "Soi Coffee Shop",
  "Dkai",
  "Coffee Spot",
  "Yuyu Cafe",
  "11:11 Cafe",
  "Hoon Bakery & Cafe",
  "Cafe Tasia",
  "Gourmet Frappe Coffee",
  "Dulce Dessert Cafe",
  "Yoogi",
  "Tea Barrel",
  "Cafe Angelo",
  "The Coffee Bar",
  "Weekend Cafe",
  "Fabularized Cafe",
  "Road Side",
  "Mono",
  "Panchika",
  "Matcha Fam",
  "Hiraya",
  "Starbucks Tagum",
  "SIP cafe",
  "Caffeine Jitters & Coi",
  "Suyop",
  "Dasco cafe and roastery",
  "BRSTA",
  "Area Spot",
  "Alune coffee shop",
  "Shell Cafe",
  "Daleachious Cafe",
  "Kuan Cafe", // looks like it repeats #23 -- see NOTES below
  "Ricardo Caffe",
  "ABZ Ramyeon Cafe",
  "Re- Start Cafe",
  "Green Coffee",
  "Annie pie Robinson",
  "NGAPETA.TGM",
  "Kapening",
  "Turq cafe",
  "Mama Jean",
  "Bean & Beam",
  "Old House Cafe",
  "Bean & Barrel Coffee Bar",
  "PAAYO cafe",
  "dear coffee .co", // possibly the same as "Dear coffee" above -- see NOTES
  "Grind and Brew Cafe Bistro",
  "HARU",
  "Mama Jeans", // possibly the same as "Mama Jean" above -- see NOTES
  "Sip Space",
  "Delight Tagum",
];

// Marked with an open circle (◦) instead of a checkmark in your notes --
// treat these as unconfirmed until you double-check them.
const UNVERIFIED_NAMES = new Set([
  "Ricardo Caffe",
  "ABZ Ramyeon Cafe",
  "Annie pie Robinson",
  "Kapening",
  "Old House Cafe",
  "Grind and Brew Cafe Bistro",
  "Delight Tagum",
]);

// NOTES:
// "Kuan cafe"/"Kuan Cafe", "Dear coffee"/"dear coffee .co", and
// "Mama Jean"/"Mama Jeans" all look like they could be the same shop
// listed twice, or two real distinct branches. They're seeded as
// separate docs (the slugger below appends "-2" on a name collision) --
// merge or delete the extra doc once you know which it is.

// ---------------------------------------------------------------------------
// 2. Schema-derived placeholders
// ---------------------------------------------------------------------------

const TAGUM_CENTER = { lat: 7.4478, lng: 125.8078 }; // Tagum City proper, approx.
const JITTER_DEG = 0.02; // spreads pins across roughly a 2km radius

const TAG_OPTIONS = [
  "Quiet", "Study-Friendly", "Airconditioned", "Open 24/7", "Outdoor Seating",
  "Vegan Options", "Power Outlets", "Group-Friendly",
];

const PRODUCT_POOL = [
  { name: "Espresso", description: "A bold espresso shot.", category: "Espresso", min: 70, max: 130 },
  { name: "Americano", description: "Espresso with hot water.", category: "Espresso", min: 80, max: 150 },
  { name: "Cappuccino", description: "Espresso with silky milk foam.", category: "Latte", min: 110, max: 190 },
  { name: "Cafe Latte", description: "Smooth espresso and steamed milk.", category: "Latte", min: 115, max: 200 },
  { name: "Matcha Latte", description: "Earthy matcha with milk.", category: "Non-Coffee", min: 120, max: 210 },
  { name: "Chocolate Frappe", description: "A chilled chocolate blend.", category: "Non-Coffee", min: 130, max: 230 },
  { name: "Butter Croissant", description: "Freshly baked and buttery.", category: "Pastries & Food", min: 65, max: 130 },
  { name: "Chicken Pesto Sandwich", description: "A filling cafe classic.", category: "Pastries & Food", min: 140, max: 260 },
  { name: "Bottled Water", description: "Chilled drinking water.", category: "Other", min: 25, max: 50 },
  { name: "Iced Tea", description: "Fresh brewed and refreshing.", category: "Other", min: 50, max: 100 },
];

const DEFAULT_HOURS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].reduce(
  (acc, day) => {
    acc[day] = { open: "07:00", close: "21:00", closed: false };
    return acc;
  },
  {}
);

const SEED_OWNER_ID = "seed-script"; // not a real Firebase Auth uid

// ---------------------------------------------------------------------------
// 3. Small deterministic helpers (same name always -> same fake data)
// ---------------------------------------------------------------------------

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const usedSlugs = new Map();
function uniqueSlug(name) {
  const base = slugify(name);
  const count = usedSlugs.get(base) ?? 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

function buildShop(name) {
  const rng = mulberry32(hashString(name));
  const priceMin = Math.floor(40 + rng() * 211);
  const tagCount = 1 + Math.floor(rng() * 3);
  const tagStart = Math.floor(rng() * TAG_OPTIONS.length);
  const tags = Array.from({ length: tagCount }, (_, index) => TAG_OPTIONS[(tagStart + index) % TAG_OPTIONS.length]);
  const reviewCount = Math.floor(3 + rng() * 95);
  const ratingCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let ratingTotal = 0;
  for (let index = 0; index < reviewCount; index += 1) {
    const roll = rng();
    const rating = roll < 0.03 ? 1 : roll < 0.09 ? 2 : roll < 0.24 ? 3 : roll < 0.57 ? 4 : 5;
    ratingCounts[String(rating)] += 1;
    ratingTotal += rating;
  }
  return {
    name,
    ownerId: SEED_OWNER_ID,
    address: "Tagum City, Davao del Norte, Philippines", // placeholder
    lat: round6(TAGUM_CENTER.lat + (rng() * 2 - 1) * JITTER_DEG),
    lng: round6(TAGUM_CENTER.lng + (rng() * 2 - 1) * JITTER_DEG),
    priceMin,
    priceMax: priceMin + Math.floor(rng() * 101),
    hasWifi: rng() >= 0.2,
    tags,
    description: `${name} is a welcoming coffee stop in Tagum City.`,
    photos: [],
    hours: DEFAULT_HOURS,
    status: "approved",
    avgRating: Math.round((ratingTotal / reviewCount) * 10) / 10,
    reviewCount,
    ratingCounts,
    viewCount: 0,
  };
}

function buildProducts(name) {
  const rng = mulberry32(hashString(`${name}:products`));
  const count = 3 + Math.floor(rng() * 6);
  const start = Math.floor(rng() * PRODUCT_POOL.length);
  return Array.from({ length: count }, (_, index) => {
    const item = PRODUCT_POOL[(start + index) % PRODUCT_POOL.length];
    return {
      id: slugify(item.name),
      name: item.name,
      description: item.description,
      category: item.category,
      price: Math.floor(item.min + rng() * (item.max - item.min + 1)),
      available: rng() >= 0.1,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. Firebase + main
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "Missing Firebase config. Run with your env file loaded, e.g.:\n" +
      "  node --env-file=.env scripts/seed-shops.mjs"
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : SHOP_NAMES.length;
  const names = SHOP_NAMES.slice(0, limit);

  console.log(
    `${dryRun ? "[dry run] " : ""}Seeding ${names.length} of ${SHOP_NAMES.length} shops into Firestore project "${firebaseConfig.projectId}"...\n`
  );

  for (const name of names) {
    const id = uniqueSlug(name);
    const shop = buildShop(name);
    const products = buildProducts(name);

    if (dryRun) {
      console.log(`  would write shops/${id}`, shop);
      products.forEach((product) => console.log(`    would write shops/${id}/products/${product.id}`, product));
    } else {
      // Overwrite the demo document so retired fields such as wifiRating and
      // tagline cannot survive a re-seed and make the stricter rules reject it.
      await setDoc(doc(db, "shops", id), shop);
      for (const product of products) {
        await setDoc(doc(db, "shops", id, "products", product.id), {
          ...product,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }
      console.log(`  \u2713 ${name}  ->  shops/${id}`);
    }
  }

  const unverifiedSeeded = names.filter((n) => UNVERIFIED_NAMES.has(n));
  if (unverifiedSeeded.length) {
    console.log(
      "\n\u26A0  These were marked unverified in your notes -- confirm they're still open before your demo:"
    );
    unverifiedSeeded.forEach((n) => console.log(`  - ${n}`));
  }

  console.log(
    "\nDone. Remember: address/lat/lng/prices/hasWifi/ratings above are placeholders, not real data."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
