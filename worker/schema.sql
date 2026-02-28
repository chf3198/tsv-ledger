-- Auth.js D1 Schema (ADR-009)
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  emailVerified INTEGER,
  name TEXT,
  image TEXT,
  createdAt INTEGER DEFAULT (unixepoch())
);

-- OAuth accounts linked to users
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);

-- Session management
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- WebAuthn passkeys
CREATE TABLE IF NOT EXISTS passkeys (
  id TEXT PRIMARY KEY,
  credentialID TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  publicKey BLOB NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT,
  createdAt INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_userId ON accounts(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(sessionToken);
CREATE INDEX IF NOT EXISTS idx_passkeys_userId ON passkeys(userId);

-- Temporary challenge storage for WebAuthn
CREATE TABLE IF NOT EXISTS challenges (
  email TEXT PRIMARY KEY,
  challenge TEXT NOT NULL,
  expires INTEGER NOT NULL
);

-- User expenses (ADR-019: Cloud Sync)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL,
  category TEXT DEFAULT 'Uncategorized',
  businessPercent INTEGER DEFAULT 100,
  paymentMethod TEXT,
  reviewed INTEGER DEFAULT 0,
  createdAt INTEGER DEFAULT (unixepoch()),
  updatedAt INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Import history per user
CREATE TABLE IF NOT EXISTS import_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  recordsCount INTEGER DEFAULT 0,
  duplicatesCount INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  dateRangeEarliest TEXT,
  dateRangeLatest TEXT,
  success INTEGER DEFAULT 1,
  timestamp INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_userId ON expenses(userId);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_import_history_userId ON import_history(userId);
