import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => client.query('ALTER TABLE mock_tests ADD COLUMN IF NOT EXISTS section text DEFAULT \'General\' NOT NULL'))
  .then(() => {
    console.log('Column added');
    client.end();
  })
  .catch((e) => {
    console.error('Error:', e.message);
    client.end();
    process.exit(1);
  });
