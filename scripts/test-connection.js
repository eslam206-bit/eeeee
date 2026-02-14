require('dotenv').config();
const net = require('net');
const adapter = require('../database/connection');

const rawHost = process.env.POSTGRES_URL || process.env.POSTGRES_HOST || '';
let host = 'localhost';
let port = Number(process.env.POSTGRES_PORT || 5432);
const user = process.env.POSTGRES_USER || '';
const dbName = process.env.POSTGRES_DB || '';

if (rawHost && rawHost.includes('://')) {
  try {
    const parsed = new URL(rawHost);
    host = parsed.hostname;
    port = Number(parsed.port || port || 5432);
  } catch (err) {
    host = process.env.POSTGRES_HOST || 'localhost';
    port = Number(process.env.POSTGRES_PORT || 5432);
  }
} else {
  host = process.env.POSTGRES_HOST || 'localhost';
  port = Number(process.env.POSTGRES_PORT || 5432);
}

(async () => {
  try {
    console.log('DB_TYPE=', process.env.DB_TYPE || 'sqlite');
    if ((process.env.DB_TYPE || 'sqlite').toLowerCase() === 'postgres') {
      console.log(`Postgres config: host=${host} port=${port} user=${user} database=${dbName} ssl=${process.env.POSTGRES_SSL}`);

      // quick TCP reachability test
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeoutMs = 3000;
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error('TCP connection timed out'));
        }, timeoutMs);

        socket.once('error', (err) => {
          clearTimeout(timer);
          socket.destroy();
          reject(err);
        });

        socket.connect(port, host, () => {
          clearTimeout(timer);
          socket.end();
          resolve();
        });
      });

      console.log('TCP connection to Postgres OK — attempting DB query');
      const res = await adapter.query('SELECT NOW() as now');
      console.log('Postgres connected, now=', res.rows ? res.rows[0].now : res);
    } else {
      console.log('Using sqlite adapter');
      const rows = await adapter.all('SELECT 1 as ok');
      console.log('Sqlite connected, ok=', rows && rows.length ? rows[0].ok : rows);
    }
    process.exit(0);
  } catch (err) {
    console.error('Connection test failed', err);
    process.exit(2);
  }
})();
