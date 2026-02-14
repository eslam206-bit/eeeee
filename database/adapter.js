const path = require('path');
const fs = require('fs');

const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

let adapter = null;

if (DB_TYPE === 'postgres') {
  // Lazy require to avoid pulling pg when not needed
  const pgConn = require('./postgres-connection');

  adapter = {
    query: async (text, params = []) => {
      return pgConn.query(text, params);
    },
    get: async (text, params = []) => {
      const res = await pgConn.query(text, params);
      return (res && res.rows && res.rows[0]) || null;
    },
    all: async (text, params = []) => {
      const res = await pgConn.query(text, params);
      return res.rows || [];
    },
    run: async (text, params = []) => {
      // For postgres, return an object similar to better-sqlite3's run
      const res = await pgConn.query(text, params);
      return {
        lastInsertRowid: res && res.rows && res.rows[0] && res.rows[0].id,
        changes: res.rowCount || 0
      };
    },
    transaction: async (callback) => {
      return pgConn.transaction(callback);
    },
    close: async () => {
      return pgConn.close();
    }
  };
  // expose pool for session store or other integrations
  adapter.pool = pgConn.pool;
} else {
  // sqlite - synchronous underlying API; wrap to async-compatible adapter
  const Database = require('better-sqlite3');
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), 'database', 'hos.db');

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  function normalizePlaceholdersForSqlite(sql) {
    // Replace $1, $2 ... with ? so positional parameters work with better-sqlite3
    return sql.replace(/\$\d+/g, '?');
  }

  adapter = {
    query: async (sql, params = []) => {
      const stmt = db.prepare(normalizePlaceholdersForSqlite(sql));
      const rows = params && params.length ? stmt.all(...params) : stmt.all();
      return { rows, rowCount: rows.length };
    },
    get: async (sql, params = []) => {
      const stmt = db.prepare(normalizePlaceholdersForSqlite(sql));
      return params && params.length ? stmt.get(...params) : stmt.get();
    },
    all: async (sql, params = []) => {
      const stmt = db.prepare(normalizePlaceholdersForSqlite(sql));
      return params && params.length ? stmt.all(...params) : stmt.all();
    },
    run: async (sql, params = []) => {
      const stmt = db.prepare(normalizePlaceholdersForSqlite(sql));
      const info = params && params.length ? stmt.run(...params) : stmt.run();
      return {
        lastInsertRowid: info.lastInsertRowid,
        changes: info.changes || 0
      };
    },
    transaction: async (callback) => {
      // Accept an async callback but run operations synchronously inside sqlite transaction
      const tx = db.transaction((...args) => {
        return callback(...args);
      });
      // Execute and return
      return tx();
    },
    close: async () => {
      try {
        db.close();
      } catch (err) {
        // ignore
      }
    }
  };
  // expose raw sqlite client for integration points that need it (session store)
  adapter.client = db;
}

module.exports = adapter;
