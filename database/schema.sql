CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    title TEXT NOT NULL,
    callsign TEXT UNIQUE,
    department TEXT NOT NULL,
    hireDate TEXT,
    lastPromotion TEXT,
    discord TEXT,
    notes TEXT,
    mi INTEGER DEFAULT 0,
    air INTEGER DEFAULT 0,
    fp INTEGER DEFAULT 0,
    photo TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_callsign ON members (callsign);
CREATE INDEX IF NOT EXISTS idx_members_department ON members (department);
CREATE INDEX IF NOT EXISTS idx_members_title ON members (title);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);
