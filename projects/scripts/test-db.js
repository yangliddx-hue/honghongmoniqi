require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function main() {
  console.log('DATABASE_URL loaded:', Boolean(process.env.DATABASE_URL));

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();
  const result = await client.query('select now() as now');
  console.log('DB connected:', result.rows[0]);
  await client.end();
}

main().catch((err) => {
  console.error('DB test failed:', err.message);
  console.error(err);
  process.exit(1);
});