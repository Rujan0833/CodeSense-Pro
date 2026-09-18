import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
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

  CREATE TABLE IF NOT EXISTS analysis_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL,
    fingerprint TEXT,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS github_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    github_user_id TEXT NOT NULL,
    github_username TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    scopes TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS github_review_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    repository TEXT NOT NULL,
    pull_number INTEGER NOT NULL,
    filename TEXT NOT NULL,
    code TEXT NOT NULL,
    score INTEGER NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE analysis_history ADD COLUMN fingerprint TEXT');
} catch {
  // Existing databases already have the column.
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS analysis_history_user_fingerprint
  ON analysis_history(user_id, fingerprint)
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

export function createAnalysisHistory(userId, code, language, analysis) {
  const fingerprint = createHash('sha256')
    .update(`${language}\0${code}`)
    .digest('hex');
  const existingStmt = db.prepare(`
    SELECT id, user_id, code, language, fingerprint, analysis_json, created_at
    FROM analysis_history
    WHERE user_id = ? AND fingerprint = ?
  `);
  const existing = existingStmt.get(userId, fingerprint);

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      code: existing.code,
      language: existing.language,
      fingerprint: existing.fingerprint,
      analysis: JSON.parse(existing.analysis_json),
      createdAt: existing.created_at,
      duplicate: true
    };
  }

  const id = randomBytes(16).toString('hex');
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO analysis_history (id, user_id, code, language, fingerprint, analysis_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, code, language, fingerprint, JSON.stringify(analysis), createdAt);
  return { id, userId, code, language, fingerprint, analysis, createdAt, duplicate: false };
}

export function getAnalysisHistory(userId) {
  const stmt = db.prepare(`
    SELECT id, user_id, code, language, fingerprint, analysis_json, created_at
    FROM analysis_history
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);

  return stmt.all(userId).map((entry) => ({
    id: entry.id,
    userId: entry.user_id,
    code: entry.code,
    language: entry.language,
    fingerprint: entry.fingerprint,
    analysis: JSON.parse(entry.analysis_json),
    createdAt: entry.created_at
  }));
}

export function deleteAnalysisHistory(userId, historyId) {
  const stmt = db.prepare('DELETE FROM analysis_history WHERE id = ? AND user_id = ?');
  stmt.run(historyId, userId);
}

export function getGitHubConnection(userId) {
  const stmt = db.prepare(`
    SELECT id, user_id, github_user_id, github_username, encrypted_access_token, scopes, created_at, updated_at
    FROM github_connections
    WHERE user_id = ?
  `);
  return stmt.get(userId) || null;
}

export function saveGitHubConnection(userId, connection) {
  const existing = getGitHubConnection(userId);
  const id = existing?.id || randomBytes(16).toString('hex');
  const now = new Date().toISOString();
  const createdAt = existing?.created_at || now;
  const stmt = db.prepare(`
    INSERT INTO github_connections (
      id, user_id, github_user_id, github_username, encrypted_access_token, scopes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      github_user_id = excluded.github_user_id,
      github_username = excluded.github_username,
      encrypted_access_token = excluded.encrypted_access_token,
      scopes = excluded.scopes,
      updated_at = excluded.updated_at
  `);
  stmt.run(id, userId, connection.githubUserId, connection.githubUsername, connection.encryptedAccessToken, connection.scopes, createdAt, now);
  return getGitHubConnection(userId);
}

export function deleteGitHubConnection(userId) {
  db.prepare('DELETE FROM github_connections WHERE user_id = ?').run(userId);
}

export function createGitHubReviewHistory(userId, review) {
  const id = randomBytes(16).toString('hex');
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO github_review_history (
      id, user_id, repository, pull_number, filename, code, score, analysis_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    userId,
    review.repository,
    review.pullNumber,
    review.filename,
    review.code,
    review.analysis.score,
    JSON.stringify(review.analysis),
    createdAt
  );
  return { id, userId, ...review, createdAt };
}

export function getGitHubReviewHistory(userId) {
  const stmt = db.prepare(`
    SELECT id, user_id, repository, pull_number, filename, code, score, analysis_json, created_at
    FROM github_review_history
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  return stmt.all(userId).map((entry) => ({
    id: entry.id,
    userId: entry.user_id,
    repository: entry.repository,
    pullNumber: entry.pull_number,
    filename: entry.filename,
    code: entry.code,
    score: entry.score,
    analysis: JSON.parse(entry.analysis_json),
    createdAt: entry.created_at
  }));
}

export function deleteGitHubReviewHistory(userId, reviewId) {
  db.prepare('DELETE FROM github_review_history WHERE id = ? AND user_id = ?').run(reviewId, userId);
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
