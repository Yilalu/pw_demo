import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve the database path relative to the project by default, or relative to
// the process working directory when DATABASE_PATH is explicitly configured.
const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(here, '..', 'data', 'ecolife.db');

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
// WAL improves local read/write concurrency; foreign keys enforce ownership links.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create the complete schema on startup. IF NOT EXISTS lets existing databases
// continue working without overwriting user data.
db.exec(`
  -- Login records hold a bcrypt hash, never the original password.
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  -- Tips and products are shared catalog records; personal saves are separate.
  CREATE TABLE IF NOT EXISTS tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    impact TEXT NOT NULL,
    read_time INTEGER NOT NULL DEFAULT 2
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    rating REAL NOT NULL,
    badge TEXT NOT NULL,
    emoji TEXT NOT NULL
  );
  -- Composite keys prevent the same user from saving the same item twice.
  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tip_id INTEGER NOT NULL REFERENCES tips(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, tip_id)
  );
  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, product_id)
  );
  -- Activities are personal records and are always queried by user_id.
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    impact TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const tipCount = db.prepare('SELECT COUNT(*) AS count FROM tips').get().count;
if (tipCount === 0) {
  // Seed tips only on an empty table, so restarting the server preserves edits.
  const insertTip = db.prepare(
    'INSERT INTO tips (title, description, category, impact, read_time) VALUES (?, ?, ?, ?, ?)',
  );
  const tips = [
    ['Give your leftovers a second life', 'Plan one meal a week around what is already in your fridge. Store food in clear containers so nothing gets forgotten.', 'Food', 'Save up to 2 kg of food waste each week', 3],
    ['Make your commute count', 'Swap one short car trip a week for a walk, bike ride, or public transport. Small changes add up over a year.', 'Transport', 'Cut up to 1.5 kg of CO₂ per trip', 2],
    ['Switch to a cooler wash', 'Washing clothes at 30°C uses significantly less energy. Air-dry your clothes whenever the weather allows.', 'Energy', 'Use up to 40% less energy per load', 2],
    ['Bring your own cup', 'Keep a reusable cup in your bag or at your desk. It is a simple way to skip single-use cups during your daily coffee run.', 'Waste', 'Avoid 250 disposable cups a year', 2],
    ['Grow a little green', 'A pot of herbs on your windowsill brings fresh flavor closer and makes it easy to use just what you need.', 'Nature', 'Support pollinators and local biodiversity', 3],
    ['Let your devices rest', 'Unplug chargers and switch off standby electronics when you are done. A power strip makes this an easy one-switch habit.', 'Energy', 'Save energy every day, without the effort', 2],
    ['Choose seasonal produce', 'Look for fruits and vegetables grown nearby and in season. They often travel less and taste better, too.', 'Food', 'Support local farms and shorter supply chains', 3],
    ['Make your own cleaning kit', 'A few refillable bottles and simple ingredients can replace a cupboard full of disposable cleaning products.', 'Waste', 'Reduce plastic packaging around your home', 4],
    ['Give clothes another chapter', 'Repair a loose button, host a clothing swap, or shop secondhand before buying something new.', 'Fashion', 'Keep useful clothing out of landfill', 3],
  ];
  const seedTips = db.transaction((rows) => rows.forEach((row) => insertTip.run(...row)));
  seedTips(tips);
}

const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
if (productCount === 0) {
  // Seed a small illustrative catalog on first run.
  const insertProduct = db.prepare(
    'INSERT INTO products (name, description, category, price, rating, badge, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const products = [
    ['Everyday Reusable Bottle', 'Double-wall stainless steel that keeps your water cold and your daily routine plastic-free.', 'On the go', 28, 4.9, 'Bestseller', '🫙'],
    ['Bamboo Kitchen Starter Set', 'A thoughtfully made collection of everyday kitchen tools from fast-growing bamboo.', 'Home', 34, 4.8, 'Plastic-free', '🎋'],
    ['Organic Cotton Market Tote', 'A sturdy, roomy carry-all made from certified organic cotton for errands and adventures.', 'On the go', 18, 4.7, 'Organic', '👜'],
    ['Refillable Cleaning Duo', 'Two glass spray bottles with gentle, plant-based concentrate refills for your home.', 'Home', 26, 4.9, 'Low waste', '🧴'],
    ['Solar Pocket Charger', 'A compact, travel-ready solar charger for topping up your phone on sunny days.', 'Tech', 42, 4.6, 'Renewable', '☀️'],
    ['Beeswax Food Wraps', 'A reusable alternative to cling film, made with organic cotton and responsibly sourced beeswax.', 'Kitchen', 16, 4.8, 'Reusable', '🍯'],
    ['Recycled Glass Soap Set', 'Refillable glass dispensers with naturally scented, locally made soap.', 'Home', 32, 4.7, 'Recycled', '🫧'],
    ['Compostable Plant Pots', 'Biodegradable pots made from renewable plant fibers, ready for your next windowsill garden.', 'Garden', 14, 4.5, 'Compostable', '🌱'],
  ];
  const seedProducts = db.transaction((rows) => rows.forEach((row) => insertProduct.run(...row)));
  seedProducts(products);
}

export function publicUser(user) {
  if (!user) return null;
  // Whitelist safe profile fields so password_hash never reaches the browser.
  return { id: user.id, name: user.name, email: user.email, location: user.location, createdAt: user.created_at };
}

// Compare a submitted password with its bcrypt hash without storing plain text.
export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}
