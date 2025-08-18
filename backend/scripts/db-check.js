// scripts/db-check.js
const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://meme:meme@localhost:55432/memeapp?schema=public';

(async () => {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query('select version(), current_database(), now()');
    console.log('✅ Connected to Postgres!');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to connect to Postgres:');
    console.error(err.message);
    process.exit(1);
  } finally {
    try { await client.end(); } catch {}
  }
})();
