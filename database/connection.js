// Database connection shim - returns the adapter that provides a unified async API
// for both SQLite (better-sqlite3) and PostgreSQL (pg).
const adapter = require('./adapter');

module.exports = adapter;
