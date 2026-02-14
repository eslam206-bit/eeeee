require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const adminUser = process.env.POSTGRES_USER || 'postgres';
  const adminPassword = process.env.POSTGRES_PASSWORD || '';
  const rawHostOrUrl = process.env.POSTGRES_URL || process.env.POSTGRES_HOST || '';
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const dbName = process.env.POSTGRES_DB || 'hos_db';

  // Build pool config: accept full connection URL or discrete host/port/user/password
  const poolConfig = {
    max: 2
  };

  if (rawHostOrUrl && rawHostOrUrl.includes('://')) {
    // If a full URL is provided, connect using a connection string.
    // To ensure we connect to the administrative 'postgres' database for DB creation,
    // try to replace pathname with '/postgres' when possible.
    try {
      const u = new URL(rawHostOrUrl);
      u.pathname = '/postgres';
      poolConfig.connectionString = u.toString();
    } catch (_) {
      poolConfig.connectionString = rawHostOrUrl;
    }

    // Allow overriding auth via env vars if present
    if (process.env.POSTGRES_USER) poolConfig.user = process.env.POSTGRES_USER;
    if (process.env.POSTGRES_PASSWORD) poolConfig.password = process.env.POSTGRES_PASSWORD;
  } else {
    poolConfig.host = rawHostOrUrl || 'localhost';
    poolConfig.port = port;
    poolConfig.user = adminUser;
    poolConfig.password = adminPassword;
    poolConfig.database = 'postgres';
  }

  const pool = new Pool(poolConfig);

  try {
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created (if it did not exist).`);
  } catch (err) {
    if (err.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Failed to create database', err);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
