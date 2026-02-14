-- PostgreSQL schema for HOS application

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    fullName TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    title TEXT NOT NULL,
    callsign TEXT UNIQUE,
    department TEXT NOT NULL,
    hireDate TIMESTAMP WITH TIME ZONE,
    lastPromotion TIMESTAMP WITH TIME ZONE,
    discord TEXT,
    notes TEXT,
    mi BOOLEAN DEFAULT FALSE,
    air BOOLEAN DEFAULT FALSE,
    fp BOOLEAN DEFAULT FALSE,
    photo TEXT,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updatedAt TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legacy-compatible sessions table (matches existing SQLite name)
CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire BIGINT NOT NULL
);

-- Table for connect-pg-simple (defaults to "session")
CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS idx_members_callsign ON members (callsign);
CREATE INDEX IF NOT EXISTS idx_members_department ON members (department);
CREATE INDEX IF NOT EXISTS idx_members_title ON members (title);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
