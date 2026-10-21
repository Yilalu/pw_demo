import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, publicUser, verifyPassword } from './db.js';

// Express owns the JSON API and, in production, serves the built React frontend.
const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';
const here = path.dirname(fileURLToPath(import.meta.url));
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.disable('x-powered-by');
// Helmet supplies browser security headers. The content policy permits only
// the app itself and the two Open-Meteo hosts used by city weather lookup.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", ...(isProduction ? [] : ["'unsafe-eval'"])],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://api.open-meteo.com', 'https://geocoding-api.open-meteo.com', ...(isProduction ? [] : ['ws://localhost:5173'])],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));
app.use(express.json({ limit: '20kb' }));
// The signed cookie contains only a session identifier; account identity stays
// on the server-side session object. httpOnly blocks JavaScript from reading it.
app.use(session({
  name: 'ecolife.sid',
  secret: process.env.SESSION_SECRET || 'local-ecolife-development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

function requireAuth(req, res, next) {
  // Routes that mutate or return personal data use this guard first.
  if (!req.session.userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

function validateText(value, label, maxLength = 120) {
  // Shared required-text validation prevents empty and unexpectedly long values.
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    return `${label} must be between 1 and ${maxLength} characters.`;
  }
  return null;
}

function startUserSession(req, userId, callback) {
  // Rotate the session ID at login/register to reduce session-fixation risk.
  req.session.regenerate((error) => {
    if (error) return callback(error);
    req.session.userId = userId;
    req.session.save(callback);
  });
}

// Lightweight endpoint for checking that the Express process is responding.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Create a local account after validating fields and hashing the password.
app.post('/api/auth/register', (req, res, next) => {
  const nameError = validateText(req.body?.name, 'Name', 80);
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (nameError) return res.status(400).json({ error: nameError });
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Your password must be between 8 and 128 characters.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
  ).run(req.body.name.trim(), email, bcrypt.hashSync(password, 12));
  const userId = Number(result.lastInsertRowid);
  startUserSession(req, userId, (error) => {
    if (error) return next(error);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.status(201).json({ user: publicUser(user) });
  });
});

// Authenticate using email plus bcrypt comparison, then start a fresh session.
app.post('/api/auth/login', (req, res, next) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body?.password;
  if (!emailPattern.test(email) || typeof password !== 'string' || password.length > 128) {
    return res.status(400).json({ error: 'Enter a valid email and password.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  startUserSession(req, user.id, (error) => {
    if (error) return next(error);
    res.json({ user: publicUser(user) });
  });
});

// Destroy the session and remove its cookie when a user signs out.
app.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('ecolife.sid', { httpOnly: true, sameSite: 'lax', secure: isProduction });
    res.json({ message: 'Signed out successfully.' });
  });
});

// Restore a user's public profile from the current session cookie.
app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return req.session.destroy((error) => {
      if (error) return res.status(500).json({ error: 'Unable to refresh your session.' });
      res.json({ user: null });
    });
  }
  res.json({ user: publicUser(user) });
});

// Public catalog endpoints include whether the current visitor saved each item.
app.get('/api/tips', (req, res) => {
  const tips = db.prepare(`
    SELECT t.*, EXISTS(
      SELECT 1 FROM bookmarks b WHERE b.tip_id = t.id AND b.user_id = ?
    ) AS bookmarked FROM tips t ORDER BY t.id
  `).all(req.session.userId || 0);
  res.json({ tips });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, EXISTS(
      SELECT 1 FROM favorites f WHERE f.product_id = p.id AND f.user_id = ?
    ) AS favorited FROM products p ORDER BY p.id
  `).all(req.session.userId || 0);
  res.json({ products });
});

// Bookmark endpoints require login and always use the session's user ID.
app.get('/api/bookmarks', requireAuth, (req, res) => {
  const tips = db.prepare(`
    SELECT t.*, 1 AS bookmarked FROM bookmarks b
    JOIN tips t ON t.id = b.tip_id WHERE b.user_id = ? ORDER BY b.created_at DESC
  `).all(req.session.userId);
  res.json({ tips });
});

app.put('/api/bookmarks/:tipId', requireAuth, (req, res) => {
  const tipId = Number(req.params.tipId);
  if (!Number.isInteger(tipId) || !db.prepare('SELECT id FROM tips WHERE id = ?').get(tipId)) {
    return res.status(404).json({ error: 'Tip not found.' });
  }
  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, tip_id) VALUES (?, ?)').run(req.session.userId, tipId);
  res.json({ bookmarked: true });
});

app.delete('/api/bookmarks/:tipId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND tip_id = ?').run(req.session.userId, Number(req.params.tipId));
  res.json({ bookmarked: false });
});

// Favorites are stored per user just like bookmarks, separate from the catalog.
app.get('/api/favorites', requireAuth, (req, res) => {
  const products = db.prepare(`
    SELECT p.*, 1 AS favorited FROM favorites f
    JOIN products p ON p.id = f.product_id WHERE f.user_id = ? ORDER BY f.created_at DESC
  `).all(req.session.userId);
  res.json({ products });
});

app.put('/api/favorites/:productId', requireAuth, (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || !db.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.session.userId, productId);
  res.json({ favorited: true });
});

app.delete('/api/favorites/:productId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.session.userId, Number(req.params.productId));
  res.json({ favorited: false });
});

// Every activity query includes the current user ID, preventing cross-account access.
app.get('/api/activities', requireAuth, (req, res) => {
  const activities = db.prepare(
    'SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC, id DESC',
  ).all(req.session.userId);
  res.json({ activities });
});

app.post('/api/activities', requireAuth, (req, res) => {
  const titleError = validateText(req.body?.title, 'Activity', 120);
  const category = typeof req.body?.category === 'string' && req.body.category.trim()
    ? req.body.category.trim().slice(0, 40)
    : 'Everyday';
  if (titleError) return res.status(400).json({ error: titleError });
  const result = db.prepare(
    'INSERT INTO activities (user_id, title, category, impact) VALUES (?, ?, ?, ?)',
  ).run(req.session.userId, req.body.title.trim(), category, 'A greener choice, one day at a time');
  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?')
    .get(result.lastInsertRowid, req.session.userId);
  res.status(201).json({ activity });
});

app.patch('/api/activities/:activityId', requireAuth, (req, res) => {
  const activityId = Number(req.params.activityId);
  if (!Number.isInteger(activityId)) return res.status(404).json({ error: 'Activity not found.' });
  const existing = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?')
    .get(activityId, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Activity not found.' });
  if (typeof req.body?.completed !== 'boolean') {
    return res.status(400).json({ error: 'Choose whether this activity is complete.' });
  }
  db.prepare('UPDATE activities SET completed = ? WHERE id = ? AND user_id = ?')
    .run(Number(req.body.completed), activityId, req.session.userId);
  const activity = db.prepare('SELECT * FROM activities WHERE id = ? AND user_id = ?')
    .get(activityId, req.session.userId);
  res.json({ activity });
});

app.delete('/api/activities/:activityId', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM activities WHERE id = ? AND user_id = ?')
    .run(Number(req.params.activityId), req.session.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'Activity not found.' });
  res.json({ message: 'Activity removed.' });
});

// Profile edits target only the user in the session; the client cannot pick an ID.
app.patch('/api/profile', requireAuth, (req, res) => {
  const nameError = validateText(req.body?.name, 'Name', 80);
  if (nameError) return res.status(400).json({ error: nameError });
  if (typeof req.body?.location !== 'string' || req.body.location.trim().length > 100) {
    return res.status(400).json({ error: 'Location must be 100 characters or fewer.' });
  }
  db.prepare('UPDATE users SET name = ?, location = ? WHERE id = ?')
    .run(req.body.name.trim(), req.body.location.trim(), req.session.userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user: publicUser(user) });
});

// Give unknown API paths a consistent JSON 404 instead of the frontend fallback.
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

if (isProduction) {
  // In production Express serves Vite's generated assets and supports client-side routes.
  const clientPath = path.join(here, '..', 'dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => res.sendFile(path.join(clientPath, 'index.html')));
}

// Log unexpected failures server-side and return a generic message to the client.
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// Start listening only after middleware, routes, and database setup are ready.
app.listen(port, () => console.log(`EcoLife server listening on http://localhost:${port}`));
