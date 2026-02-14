let Pool;
try {
  Pool = require('pg').Pool;
} catch (err) {
  throw new Error("Postgres driver 'pg' is not installed. Run 'npm install pg' or set DB_TYPE=sqlite to use SQLite instead.");
}

// Allow either separate env vars or a full connection URL passed via POSTGRES_URL
let poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  // increase connection timeout to tolerate transient network latency
  connectionTimeoutMillis: 10000,
  ssl: (process.env.POSTGRES_SSL === 'true') ? { rejectUnauthorized: false } : false
};

const rawUrl = process.env.POSTGRES_URL || process.env.POSTGRES_HOST || '';
if (rawUrl && rawUrl.includes('://')) {
  // Provide the full connection string directly to pg. This avoids DNS/URL
  // parsing edge-cases and lets libpq-style URLs be handled by the driver.
  poolConfig.connectionString = rawUrl;
  // Keep explicit SSL override if set
  if (process.env.POSTGRES_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig.host = process.env.POSTGRES_HOST || 'localhost';
  poolConfig.port = Number(process.env.POSTGRES_PORT || 5432);
  poolConfig.database = process.env.POSTGRES_DB || 'hos_db';
  poolConfig.user = process.env.POSTGRES_USER || undefined;
  poolConfig.password = process.env.POSTGRES_PASSWORD || undefined;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Postgres pool error', err);
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await callback({
      query: (text, params) => client.query(text, params)
    });
    await client.query('COMMIT');
    return res;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = {
  query,
  transaction,
  close,
  pool
};
