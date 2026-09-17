import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Ensure data directory exists
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex');
}

export function registerUser(name, email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Check if exists
  const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = existingStmt.get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const id = randomBytes(16).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const createdAt = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(id, name.trim(), normalizedEmail, passwordHash, salt, createdAt);

  return createSession(id);
}

export function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userStmt.get(normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const inputHash = scryptSync(password, user.salt, 64);
  const storedHash = Buffer.from(user.password_hash, 'hex');

  if (inputHash.length !== storedHash.length || !timingSafeEqual(inputHash, storedHash)) {
    throw new Error('Invalid email or password.');
  }

  return createSession(user.id);
}

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  // 30 days expiration
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const sessionStmt = db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  sessionStmt.run(token, userId, createdAt, expiresAt);

  const user = getUserById(userId);
  return { token, user };
}

export function validateSession(token) {
  if (!token) return null;

  const stmt = db.prepare(`
    SELECT users.id, users.name, users.email, users.created_at, sessions.expires_at
    FROM sessions
    JOIN users ON sessions.user_id = users.id
    WHERE sessions.token = ?
  `);
  const result = stmt.get(token);

  if (!result) return null;

  if (new Date(result.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    createdAt: result.created_at
  };
}

export function deleteSession(token) {
  if (!token) return;
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

export function getUserById(userId) {
  const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
  return stmt.get(userId);
}

// Seed demo user for instant friction-free testing
try {
  const demoStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  if (!demoStmt.get('demo@codesense.pro')) {
    const id = 'demo-user-id';
    const salt = randomBytes(16).toString('hex');
    const hash = hashPassword('demo1234', salt);
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, 'Demo Developer', 'demo@codesense.pro', hash, salt, new Date().toISOString());
  }
} catch (e) {
  console.warn('Seed notice:', e.message);
}
