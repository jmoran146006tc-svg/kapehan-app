#!/usr/bin/env node
/**
 * scripts/seed-real-shops.mjs
 *
 * Seeds /shops (+ /shops/{id}/products) from the compiled real Tagum City list.
 * Every shop is owned by ONE owner account so you can edit all of them from a
 * single login. Uses the Admin SDK (bypasses firestore.rules), so shops go in
 * as status "approved" directly.
 *
 * REAL:        name, address, lat/lng, hours, menu items + prices, photo URLs
 * PLACEHOLDER: tags (seeded-random), hasWifi (seeded-random) -> verify later
 * RATINGS:     0 / 0 unless scripts/shop-ratings.json has an entry for the slug
 *
 * USAGE (project root, PowerShell):
 *   $env:GOOGLE_APPLICATION_CREDENTIALS='C:\path\to\service-account.json'
 *
 *   # preview only (no credentials needed, nothing is written)
 *   node scripts/seed-real-shops.mjs
 *
 *   # write everything
 *   node scripts/seed-real-shops.mjs --apply --project=kapehan-app-4c616 `
 *        --owner-email=owner@example.com [--owner-password=Secret123] `
 *        [--owner-name="Kapehan Listings"] [--admin-email=admin@example.com]
 *
 *   --owner-password is only needed if the owner Auth account doesn't exist yet
 *   (the script creates it). --admin-email re-grants role:"admin" after a wipe.
 *   --force allows seeding even if shops owned by someone else already exist.
 */

import { existsSync, readFileSync } from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// 1. Data
//    menu:  "C:Item name:price|C:Item name:price"   (price blank = unpriced, skipped)
//           C = E espresso/black, L coffee+milk, N non-coffee, F food
//    hours: "days range; days range"  days = daily | mon | tue-fri | mon,wed-fri,sun
//           range = HH:MM-HH:MM | 24h | x (closed). Past-midnight closes are real
//           values (00:00, 01:00...), so isOpenNow() must handle overnight (see Codex prompt).
// ---------------------------------------------------------------------------

const SHOPS = [
  { name: 'Dusk Coffee', address: 'GSM Building, Door 6, National Highway, Brgy. Visayan Village', lat: 7.439612, lng: 125.803961, hours: 'daily 10:00-00:00', menu: 'L:Spanish Latte:150|N:Hojicha Latte:200|N:Matcha Latte:220|F:Brown Butter Cookies:30', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790677758/dusk_coffee.jpg' },
  { name: '11:11 Café', address: 'Purok Gumamela 163, Apokon', lat: 7.422271, lng: 125.82476, hours: 'daily 10:00-22:00', menu: 'F:Classic Sisig:125|F:Ultimate Chicken:135|N:Iced Matcha:90|L:Iced Latte:95', phone: '+63 905 181 5343', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790678414/11coffee.jpg' },
  { name: 'Coffee Maybe Tagum', address: 'Purok Matinabangon (inside a village)', lat: 7.459418, lng: 125.81579, hours: 'mon x; tue-fri 10:00-20:00; sat-sun 10:00-21:00', menu: 'L:Spanish Latte:175|N:Matcha Latte:189|L:Vanilla Latte:160', phone: '+63 907 370 2240', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790678770/coffee_maybe.jpg' },
  { name: 'Kuan Coffee', address: "Assessor's Village, Apokon Road", lat: 7.441139, lng: 125.817678, hours: 'daily 07:00-22:00', menu: 'L:Sea Salt Latte:160|N:Strawberry:150|N:Lychee:130', phone: '+63 967 227 0192', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790679790/kuan.jpg' },
  { name: 'Caffeine Jitters & Co.', address: 'Unit 21, Bacaltos Complex, Roxas St.', lat: 7.449826, lng: 125.802062, hours: 'daily 11:00-03:00', menu: 'L:Double Mocha Latte:280|L:Pastillas Cream Latte:280|L:Biscoff Latte:215', phone: '+63 919 711 8960', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790679927/jitters.jpg' },
  { name: 'High Ground', address: 'Ostrea Drive', lat: 7.450685, lng: 125.806641, hours: 'daily 07:00-23:00', menu: 'L:Spanish Latte:190|L:Caramel Macchiato:190|N:Choco:202', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790680219/high_ground.jpg' },
  { name: 'Mono Coffee', address: 'JRA Building 3, 2nd Floor, Purok Rattan, in front of Tagum Medical City', lat: 7.430559, lng: 125.823496, hours: 'daily 06:00-00:00', menu: 'E:Black:120|N:Ichigo:180|N:Hojicha:180', phone: '+63 985 329 0434', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790680400/mono.jpg' },
  { name: "Bean O' Clock Coffee To-Go", address: 'Opposite Rizal Elementary School main building, Sobrecarey St.', lat: 7.449141, lng: 125.802863, hours: 'mon-sat 07:30-22:30; sun 13:00-22:00', menu: 'N:Matcha Oreo:260|F:Bacon & Cheese Waffle:190|L:Mocha:170', phone: '+63 917 708 7556', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790680677/beanclock.jpg' },
  { name: 'Bean & Barrel Coffee Bar', address: 'FQ4M+559, Mankilam', lat: 7.455407, lng: 125.782984, hours: 'daily 09:00-22:00', menu: 'N:Signature Hot Chocolate:210|L:Vietnamese Latte:220|L:Banana Oat Latte:200', phone: '+63 997 822 3655', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790680925/beanbarrel.jpg' },
  { name: 'Shade Café', address: 'Sobrecarey St. corner Sison Subd., Magugpo South', lat: 7.445353, lng: 125.802061, hours: 'daily 10:00-22:00', menu: 'L:Biscoff Latte:210|L:Dubai Chewy Latte:180|N:Taro Latte:180', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790681172/shade.jpg' },
  { name: 'Mr. Brew', address: 'Purok 2, Suico Compound, San Miguel', lat: 7.440159, lng: 125.791559, hours: 'daily 10:00-22:00', menu: 'L:Cappuccino:140|L:Hazelnut:110|L:Mocha:160', phone: '+63 997 220 8992', img: 'https://res.cloudinary.com/hoeyhawg/image/upload/v1790681699/mrbrew.png' },
  { name: 'Coffee Keeper', address: 'Assessors Village, Apokon Rd.', lat: 7.441863, lng: 125.817952, hours: 'mon-sat 10:00-21:00; sun x', menu: 'F:Tapsilog:185|L:Caramel Macchiato:145|L:Coffee Affogato:165' },
  { name: 'Kurahi Coffee', address: 'Maharlika Highway corner Lapu-Lapu St., Magugpo Poblacion', lat: 7.446415, lng: 125.808158, hours: 'mon-sat 07:00-23:00; sun 13:00-22:00', menu: 'L:Butterscotch Latte:145|N:Dutch Milk Chocolate:145|L:Sea Salt Coco Latte:195|L:Java Chips + Coffee:195', phone: '+63 916 627 8528', notes: ['Alfresco seating, no aircon.'], outdoor: true },
  { name: 'Yuyu Cafe and Dessert Shop', address: 'Tagum City (exact street not listed)', lat: 7.4491, lng: 125.810473, hours: 'daily 08:00-21:00', menu: 'N:Milo Dinosaur:138|L:Salted Caramel:216|N:Matcha Frappe:216', phone: '+63 935 901 1815' },
  { name: 'HOON Bakery & Café', address: 'Corner Jose Abad Santos St. & Arellano St., Magugpo Poblacion', lat: 7.446796, lng: 125.805514, hours: 'daily 07:00-22:00', menu: 'F:Korean Buns:|F:Garlic Cream Cheese Bread:|F:Sponge Cake:|F:Fruit Cakes:', phone: '+63 999 525 0000', notes: ['Bakery; menu prices not yet collected.'] },
  { name: 'Dear Coffee & Co. Apokon', address: 'Near STI and New City Hall, Apokon Rd.', lat: 7.440471, lng: 125.818256, hours: 'mon-fri,sun 08:00-01:00; sat 09:00-01:00', menu: 'L:Hazelnut:130|L:Sea Salt Latte:149|N:Matcha Biscoff:110' },
  { name: "Neimar's Cafe", address: 'Apokon Road', lat: 7.422253, lng: 125.827735, hours: 'mon-sat 06:30-20:30; sun x', menu: 'F:Pasta:|F:Sandwiches:|F:Rice Meals:', phone: '+63 936 946 9544', notes: ['Menu prices not yet collected.'] },
  { name: 'The Turq Cafe', address: 'Space 11, City Arcade, Apokon Rd.', lat: 7.44205, lng: 125.826014, hours: 'mon x; tue-sun 10:00-22:00', menu: 'L:Biscoff Frappe:185|L:Pistachio Coffee:175|L:Spanish Latte:160', phone: '+63 936 740 9938' },
  { name: 'Kapenings', address: 'Apokon Rd.', lat: 7.443618, lng: 125.814802, hours: 'mon-sat 09:00-22:00; sun 10:00-22:00', menu: 'L:Kape Spanish:140|L:Kape White Mocha:140|L:Oreo Latte:145', phone: '+63 968 667 2197' },
  { name: 'Re-start Coffee', address: 'Beside Weatherbee, Door 7, TODAH Building, Visayan Village', lat: 7.442376, lng: 125.806096, hours: 'daily 11:00-00:00', menu: 'N:Matcha Latte V1 (Kyoto Blend):225|L:Spanish Latte:160|N:Hojicha:210|N:Strawberry Matcha:225' },
  { name: 'Kafeneio', address: 'FQ7V+XW3, Capitol Rd.', lat: 7.464879, lng: 125.794797, hours: 'daily 09:00-23:00', menu: 'L:Hazelnut Coffee:145|L:Cinnamon Cloud Latte:150|L:Biscoff Cream:170' },
  { name: 'Kape Tilapips (Mankilam Branch)', address: 'In front of ACES Tagum College, Purok Pag-ibig, Mankilam', lat: 7.463283, lng: 125.791388, hours: 'mon-sat 10:00-21:00; sun x', menu: 'N:Iced Dirty Matcha:49|L:Iced Kape Latte:49|N:Iced Chocolate:49' },
  { name: 'Rookie Cafe', address: 'E. Paramio Road', lat: 7.446381, lng: 125.794066, hours: 'mon-thu 10:00-21:00; fri-sun 10:00-22:00', menu: 'L:Biscoff Latte:165|L:Peppermint Mocha:165|N:Barbie Drink:160', phone: '+63 909 382 4595' },
  { name: 'Kanoffee', address: 'Santa Cruz Ave., beside Petron', lat: 7.460467, lng: 125.797914, hours: 'daily 09:00-00:00', menu: 'N:Dark Matcha:150|L:Salted Caramel Latte:135|L:Hazelnut Latte:135', phone: '+63 910 260 9331', notes: ['Drive-thru style.'], driveThru: true },
  { name: 'Café Mellow', address: 'National Highway, Canocotan', lat: 7.407347, lng: 125.777277, hours: 'daily 09:00-00:00', menu: 'L:Coffee & Cocoa:195|L:Honey Soy Latte:185|N:Strawberry Milk:170', phone: '+63 932 161 2101', notes: ['Drive-thru only.'], driveThru: true },
  { name: 'The Brew Wenyo', address: 'Purok 28B, Kawayanan, Timog Ave., Madaum', lat: 7.41572, lng: 125.80088, hours: 'daily 16:30-00:00', menu: 'L:Spanish Latte:125|L:Sea Salt Oat Latte:180|L:Midnight Nutella Latte:130', phone: '+63 952 445 5628' },
  { name: 'Shell Cafe', address: 'CQHV+2FR, Visayan Village (Shell station)', lat: 7.42762, lng: 125.793644, hours: 'daily 24h', menu: 'L:Café Latte:122|L:Caffe Mocha:141|L:French Vanilla Latte:141', phone: '+63 991 022 0080', open24: true },
  { name: 'Heisei Coffee Tagum', address: 'Tiempo Building, behind Tagum Eye Center, Daisy St., Visayan Village', lat: 7.43964, lng: 125.804679, hours: 'mon x; tue-sat 10:00-20:00; sun 13:00-20:00', menu: 'N:Ube Milk:140|N:Matcha Level 3:240|N:White Chocolate:160' },
  { name: 'Paayo Cafe', address: 'Daang Maharlika Hwy., Visayan Village', lat: 7.423226, lng: 125.790423, hours: 'mon-sat 10:00-23:30; sun 16:00-23:30', menu: 'L:Asin Tibook Latte:215|L:Salted Caramel:180|L:Blueberry Latte:165' },
  { name: 'Palm Breeze Café', address: 'Purok Saging, Visayan Village', lat: 7.434022, lng: 125.798877, hours: 'daily 06:00-22:00', menu: 'L:Cappuccino:178|L:Cafe Mocha:198|N:Chocolate:168|N:Matcha Latte:178', phone: '+63 967 453 6898', notes: ['Restaurant-style cafe.'] },
  { name: 'Coffee Box', address: 'Purok 1, La Filipina', lat: 7.477369, lng: 125.802712, hours: 'mon-fri 17:00-22:00; sat-sun 10:00-00:00', menu: 'L:French Vanilla Latte:79|E:Cafe Americano:50|N:Cookies n Cream:79|N:Iced Choco:79' },
  { name: 'Christianitea Tagum', address: 'Rizal St.', lat: 7.44819, lng: 125.803058, hours: 'daily 10:00-00:00', menu: 'L:Honey Oat Latte:160|L:Caramel Macchiato:150|N:Ube Oat Matcha:190|N:Blueberry Matcha:190' },
  { name: "Martha's Coffee House", address: 'Purok Kalamboan, Magugpo North', lat: 7.467597, lng: 125.818087, hours: 'mon-sat 08:00-17:00; sun x', menu: 'L:Oreo Spanish:145|N:Dirty Matcha:145|N:Matcha Biscoff:155|N:Matcha Oat Strawberry:150', phone: '+63 910 275 9452', notes: ['Set back from the main road.'] },
  { name: 'The Breakfast Club Tagum', address: '279 Piatos Ave., Delfina Subdivision', lat: 7.454, lng: 125.812008, hours: 'daily 24h', menu: 'N:Milo Latte:150|L:Cappuccino:150|N:Matcha Latte:155', phone: '+63 84 216 7801', open24: true },
  { name: 'Green Coffee - Tagum', address: 'Central Warehouse Club, Apokon Road', lat: 7.444824, lng: 125.813447, hours: 'daily 07:00-02:00', menu: 'L:Flat White:175|L:Con Leche:175|N:Signature Chocolate:190', notes: ['Listed 7AM-2AM on Google; reviews call it 24/7.'] },
  { name: 'KOROA Coffee Tagum', address: 'Mabini St.', lat: 7.447229, lng: 125.805301, hours: 'mon-thu,sun 12:00-00:00; fri-sat 13:00-01:00', menu: 'L:Durian Latte:170|N:Ube Matcha:170|L:Spanish Latte:155', phone: '+63 968 629 4705', notes: ['Cash only.'] },
  { name: 'Mama Jeans Matcha Bar', address: 'Magugpo North Barangay Center, Suaybaguio-C La Fortuna', lat: 7.462557, lng: 125.81612, hours: 'mon-sat 13:00-23:00; sun x', menu: 'N:Matcha Latte:220|N:Hojicha Latte:190|F:Banana Pudding:280|L:Biscoff Latte:180' },
  { name: 'Matcha Fam', address: 'Gumamela Subdivision, 4 Mirafuentes St., Magugpo North', lat: 7.456439, lng: 125.812472, hours: 'mon,wed-fri,sun 13:00-22:00; tue 18:00-22:00; sat 15:30-22:00', menu: 'N:Sea Salt Matcha Latte:190|N:Vanilla Matcha Latte:185', phone: '+63 993 289 0162', notes: ['Inside a residential area.'] },
  { name: 'Cove Café', address: 'Sobrecarey St., near City Hardware and the junction to Christ the King Cathedral', lat: 7.44069, lng: 125.802612, hours: 'daily 10:00-22:00', menu: 'L:Caramel Nut:130|L:Almond Latte:180|N:Hershey Choco:110|N:Oreo Strawberry:130|F:Shrimp Aglio e Olio:195|F:Cove Carbonara:180', phone: '+63 962 137 9588' },
  { name: '22.27 Korean Cafe', address: 'CRW3+W86, Mabini St. (shares space with J3 Korean Mart)', lat: 7.447286, lng: 125.803268, hours: 'daily 08:30-21:00', menu: 'L:Rose Latte:175|L:Black Sesame Latte Espresso:175|L:Mincho Latte:160|F:Beef Bulgogi:315|F:Shrimp Pesto Pasta:285' },
  { name: 'Mabeani Cafe and Restaurant', address: 'CRX4+293, corner Mabini St. and Jose Abad Santos St., Magugpo Poblacion', lat: 7.447508, lng: 125.805924, hours: 'daily 10:00-21:00', menu: 'E:Americano:125|L:Spanish Latte:175|F:Biscoff Cheesecake:200|F:Chocolate Cake:180', phone: '+63 962 316 5532' },
  { name: 'RC Drip Cafè', address: 'Door 5, Paulino Magno St., Purok Palmera, Visayan Village, beside Happy Home Hotel', lat: 7.425587, lng: 125.800723, hours: 'mon-sat 07:00-22:00; sun x', menu: 'L:Caramel Macchiato:110|L:Spanish Latte:110|L:Hazelnut Latte:110', phone: '+63 935 616 9563' },
  { name: 'Tea Barrel Tagum', address: 'CRW4+655, Jose Abad Santos St.', lat: 7.445498, lng: 125.80542, hours: 'daily 11:00-21:00', menu: 'N:Lemon Tea:149|N:Passion Fruit Tea:149', phone: '+63 936 947 1982' },
  { name: 'Kôfe Badi', address: 'CRV3+QVM, Osmeña St., beside Balon\'s Lechon, in front of Chick It Out', lat: 7.444424, lng: 125.804474, hours: 'mon-sat 11:30-20:30; sun 13:00-20:30', menu: 'L:Iced Almond Latte:160|N:Dirty Matcha:160|F:French Toast:195|N:Choco Lava:175', phone: '+63 997 794 3135' },
  { name: 'Blugre Coffee Tagum', address: 'CRW4+2XP, Magugpo Poblacion', lat: 7.445098, lng: 125.807466, hours: 'daily 07:30-01:00', menu: 'L:Durian Coffeeccino:275|L:Mocha:235|F:Blueberry Cake:205' },
  { name: "Miko's Brew Tagum", address: 'CRV7+9M, Tagum', lat: 7.443427, lng: 125.81424, hours: 'daily 07:30-22:00', menu: 'L:White Chocolate Mocha:165|L:Vanilla Latte:155|F:Brownie Ala Mode:275|F:Mango Panna Cotta:205', phone: '+63 932 843 0506' },
  { name: 'Kafe Snowbell', address: 'CRVF+MWX, Tagum', lat: 7.44398, lng: 125.824856, hours: 'mon-tue 10:00-22:00; wed-sun 09:00-01:00', menu: 'E:White Americano:155|L:French Vanilla:170|N:Buko Matcha:155|N:Mango Milk:180', notes: ['Cat cafe.'] },
  { name: 'Catsy Coffee', address: '1495 Manuel B. Suaybaguio Sr. St.', lat: 7.458352, lng: 125.811807, hours: 'daily 17:00-23:30', menu: 'L:Sea Salt Latte:115|N:Milo Latte:120|N:Matcha Bliss:130|N:Ube Taro Bliss:110', phone: '+63 976 293 5051', notes: ['Opening time assumed 5PM (Google omits AM/PM).'] },
  { name: 'Ryokou 8100', address: 'FR56+4X, Tagum', lat: 7.458085, lng: 125.812634, hours: 'daily 15:30-00:00', menu: 'L:Mactan Oat:200|L:Voyager (Sea Salt):190|L:Biscoff:190|N:Ube Cloud:160|F:Onion Rings:149', phone: '+63 954 306 9954' },
  { name: 'Annipie', address: 'Robinsons Place Tagum, CQHW+VP', lat: 7.429713, lng: 125.796801, hours: 'daily 07:00-21:00', menu: 'L:Cappuccino:192|L:Iced Tiramisu Macchiato:240|F:Brownies:300|F:Classic Cinnamon Roll:73' },
  { name: 'Starbucks', address: 'CRR4+H4R, National Highway corner Jose Abad Santos Street', lat: 7.441252, lng: 125.805395, hours: 'daily 07:00-00:00', menu: 'E:Americano:175|L:Latte:185|N:Pure Matcha:190' },
  { name: 'Miu Matcha Cafe', address: 'CRX4+79, Tagum', lat: 7.448758, lng: 125.805816, hours: 'daily 15:00-21:00', menu: 'N:Yabukita:230|F:Matcha Gelato:250|N:Hojicha:230' },
  { name: 'Wallside', address: 'CRW3+57W, Garcia St.', lat: 7.445772, lng: 125.803154, hours: 'daily 10:00-00:00', menu: 'L:Spanish Latte:129|E:Iced Americano:119|L:Caramel Macchiato:129' },
  { name: 'Aurora Coffee', address: 'CRW6+W4, Tagum', lat: 7.447584, lng: 125.810326, hours: 'daily 15:00-00:00', menu: 'E:Long Black:150|N:Iced Matcha Latte:220|L:Affogato:295' },
  { name: 'Coffee Break', address: 'CRW3+P6H, Arellano St.', lat: 7.448125, lng: 125.802778, hours: 'daily 10:00-22:00', menu: 'L:French Vanilla:69|N:Strawberry Matcha:79|L:Salted Caramel:69' },
  { name: 'Nicchiato', address: 'CRW2+55, Tagum', lat: 7.445625, lng: 125.800316, hours: 'mon-sat 09:30-22:00; sun 12:30-22:00', menu: 'L:Caramel Macchiato:185|L:Biscoff Latte:230|L:Himalayan Latte:220' },
];

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const CATEGORY = { E: 'Espresso', L: 'Latte', N: 'Non-Coffee', F: 'Pastries & Food' };
// Must match src/constants/tags.ts. Open 24/7 and Outdoor Seating are only ever added from real data.
const RANDOM_TAGS = ['Quiet', 'Study-Friendly', 'Airconditioned', 'Vegan Options', 'Power Outlets', 'Group-Friendly'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function option(name) {
  return process.argv.find((a) => a.startsWith(`${name}=`))?.slice(name.length + 1);
}
const flag = (name) => process.argv.includes(name);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = (hash << 5) - hash + str.charCodeAt(i); hash |= 0; }
  return hash >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function slugify(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parseDays(spec) {
  if (spec === 'daily') return [...DAYS];
  return spec.split(',').flatMap((part) => {
    const [a, b] = part.split('-');
    if (!DAYS.includes(a) || (b && !DAYS.includes(b))) throw new Error(`Bad day spec "${spec}"`);
    return b ? DAYS.slice(DAYS.indexOf(a), DAYS.indexOf(b) + 1) : [a];
  });
}

function parseHours(source, label) {
  const closed = () => ({ open: '00:00', close: '00:00', closed: true });
  const hours = Object.fromEntries(DAYS.map((d) => [d, closed()]));
  const seen = new Set();
  for (const segment of source.split(';').map((s) => s.trim()).filter(Boolean)) {
    const [spec, range] = segment.split(/\s+/);
    for (const day of parseDays(spec)) {
      seen.add(day);
      if (range === 'x') hours[day] = closed();
      else if (range === '24h') hours[day] = { open: '00:00', close: '23:59', closed: false };
      else {
        const [open, close] = range.split('-');
        if (!TIME.test(open) || !TIME.test(close)) throw new Error(`${label}: bad time "${range}"`);
        hours[day] = { open, close, closed: false };
      }
    }
  }
  const missing = DAYS.filter((d) => !seen.has(d));
  if (missing.length) throw new Error(`${label}: hours missing for ${missing.join(', ')}`);
  return hours;
}

function parseMenu(source) {
  const used = new Set();
  return source.split('|').map((entry) => {
    const [code, name, price] = entry.split(':');
    if (!CATEGORY[code]) throw new Error(`Bad menu category in "${entry}"`);
    const id = slugify(name);
    if (used.has(id)) throw new Error(`Duplicate menu item "${name}"`);
    used.add(id);
    return { id, name, category: CATEGORY[code], price: price === '' || price === undefined ? null : Number(price) };
  });
}

function buildShop(raw, ownerId, ratings) {
  const slug = slugify(raw.name);
  const rng = mulberry32(hashString(raw.name));
  const menu = parseMenu(raw.menu);
  const priced = menu.filter((m) => m.price !== null);
  const drinks = priced.filter((m) => m.category !== CATEGORY.F);
  const basis = (drinks.length ? drinks : priced).map((m) => m.price);

  // Tags: seeded random, plus the two that come from real data. Drive-thru shops get no random tags.
  const tags = new Set();
  if (!raw.driveThru) {
    const pool = [...RANDOM_TAGS];
    const count = 2 + Math.floor(rng() * 3); // 2-4
    for (let i = 0; i < count; i++) tags.add(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  if (raw.open24) tags.add('Open 24/7');
  if (raw.outdoor) tags.add('Outdoor Seating');

  const rating = ratings[slug];
  const reviewCount = rating?.reviewCount > 0 ? rating.reviewCount : 0;
  const shop = {
    name: raw.name,
    ownerId,
    address: raw.address,
    lat: raw.lat,
    lng: raw.lng,
    priceMin: basis.length ? Math.min(...basis) : 0,
    priceMax: basis.length ? Math.max(...basis) : 0,
    hasWifi: raw.driveThru ? false : rng() < 0.8, // PLACEHOLDER
    tags: [...tags].slice(0, 6),
    description: [...(raw.notes ?? ['Coffee shop in Tagum City.']), raw.phone ? `Tel ${raw.phone}` : null].filter(Boolean).join(' '),
    photos: raw.img ? [raw.img] : [],
    hours: parseHours(raw.hours, raw.name),
    status: 'approved',
    avgRating: reviewCount ? rating.avgRating : 0,
    reviewCount,
    viewCount: 0,
  };
  // With no imported rating, start the star histogram at zero. With an imported rating,
  // only write a histogram if one was actually provided (never invent a distribution).
  if (!reviewCount) shop.ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  else if (rating.ratingCounts) shop.ratingCounts = rating.ratingCounts;

  return { slug, shop, products: priced.map(({ id, name, category, price }) => ({ id, name, category, price })), unpriced: menu.length - priced.length, noPrice: !basis.length };
}

function loadRatings() {
  const path = new URL('./shop-ratings.json', import.meta.url);
  if (!existsSync(path)) return {};
  const data = JSON.parse(readFileSync(path, 'utf8'));
  for (const [slug, r] of Object.entries(data)) {
    const ok = typeof r.avgRating === 'number' && r.avgRating >= 0 && r.avgRating <= 5 && Number.isInteger(r.reviewCount) && r.reviewCount >= 0;
    if (!ok) throw new Error(`shop-ratings.json: invalid entry for "${slug}"`);
  }
  return data;
}

async function upsertUser(db, uid, email, name, role) {
  await db.doc(`users/${uid}`).set({
    name, email, role, status: 'active',
    createdAt: FieldValue.serverTimestamp(), agreedToTermsAt: FieldValue.serverTimestamp(),
    preferences: {}, savedShopIds: [], recentlyViewed: [], visitCount: 0,
  }, { merge: true });
}

async function findAuthUser(auth, email) {
  try { return await auth.getUserByEmail(email); }
  catch (error) { if (error?.code === 'auth/user-not-found') return null; throw error; }
}

// ---------------------------------------------------------------------------
// 3. Main
// ---------------------------------------------------------------------------

async function main() {
  const apply = flag('--apply');
  const ratings = loadRatings();
  const built = SHOPS.map((raw) => buildShop(raw, '<owner-uid>', ratings));

  const slugs = new Set();
  for (const b of built) {
    if (slugs.has(b.slug)) throw new Error(`Duplicate shop slug "${b.slug}"`);
    slugs.add(b.slug);
  }
  for (const slug of Object.keys(ratings)) if (!slugs.has(slug)) console.warn(`shop-ratings.json: unknown slug "${slug}" (ignored)`);

  console.log(`${apply ? 'Seeding' : 'Preview:'} ${built.length} shops, ${built.reduce((n, b) => n + b.products.length, 0)} menu items.\n`);
  for (const { slug, shop, products } of built) {
    const range = shop.priceMax ? `₱${shop.priceMin}-₱${shop.priceMax}` : 'no prices';
    console.log(`  ${slug.padEnd(34)} ${range.padEnd(12)} ${String(products.length).padStart(2)} items  ★${shop.avgRating}(${shop.reviewCount})  [${shop.tags.join(', ') || '-'}]`);
  }
  const noPhoto = built.filter((b) => !b.shop.photos.length).length;
  const noPrice = built.filter((b) => b.noPrice).map((b) => b.shop.name);
  console.log(`\n⚠  ${noPhoto} shops have no photo (they show the gradient placeholder).`);
  if (noPrice.length) console.log(`⚠  No menu prices yet (priceMin/priceMax = 0, shows as Budget): ${noPrice.join(', ')}`);
  console.log('⚠  Tags and hasWifi are seeded-random placeholders, verify before presenting them as real.');

  if (!apply) { console.log('\nNo writes made. Re-run with --apply --project=<id> --owner-email=<email> to write.'); return; }

  // ---- apply ----
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a service-account key first.');
  const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  const projectId = serviceAccount.project_id;
  if (option('--project') !== projectId) throw new Error(`Pass --project=${projectId} to confirm the target project.`);
  const ownerEmail = option('--owner-email');
  if (!ownerEmail) throw new Error('Pass --owner-email=<email> (the single account that will own every shop).');

  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  const db = getFirestore(app);
  const auth = getAuth(app);

  let owner = await findAuthUser(auth, ownerEmail);
  if (!owner) {
    const password = option('--owner-password');
    if (!password) throw new Error(`No Auth account for ${ownerEmail}. Pass --owner-password=<6+ chars> to create it, or register it in the app first.`);
    owner = await auth.createUser({ email: ownerEmail, password, displayName: option('--owner-name') ?? 'Kapehan Listings' });
    console.log(`\nCreated Auth account ${ownerEmail} (${owner.uid}).`);
  }
  await upsertUser(db, owner.uid, ownerEmail, option('--owner-name') ?? owner.displayName ?? 'Kapehan Listings', 'owner');
  console.log(`Owner profile ready: ${ownerEmail} (${owner.uid}) role=owner`);

  const adminEmail = option('--admin-email');
  if (adminEmail) {
    const admin = await findAuthUser(auth, adminEmail);
    if (!admin) throw new Error(`No Auth account for admin ${adminEmail}.`);
    await upsertUser(db, admin.uid, adminEmail, admin.displayName ?? 'Kapehan Admin', 'admin');
    console.log(`Admin profile ready: ${adminEmail} (${admin.uid}) role=admin`);
  }

  const foreign = (await db.collection('shops').get()).docs.filter((d) => d.data().ownerId !== owner.uid && !slugs.has(d.id));
  if (foreign.length && !flag('--force')) {
    throw new Error(`${foreign.length} existing shops belong to other owners. Run reset-database.mjs first, or pass --force.`);
  }

  const ops = [];
  for (const { slug, shop, products } of built) {
    const ref = db.doc(`shops/${slug}`);
    await db.recursiveDelete(ref.collection('products')); // re-runs replace the menu cleanly
    ops.push([ref, { ...shop, ownerId: owner.uid }]);
    for (const p of products) {
      ops.push([ref.collection('products').doc(p.id), { ...p, available: true, createdAt: FieldValue.serverTimestamp() }]);
    }
  }
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const [ref, data] of ops.slice(i, i + 400)) batch.set(ref, data);
    await batch.commit();
  }
  console.log(`\nDone. Wrote ${built.length} shops and ${ops.length - built.length} menu items, all owned by ${ownerEmail}.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
