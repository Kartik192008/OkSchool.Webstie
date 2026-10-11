import { Client } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '..', '..', 'artifacts', 'api-server', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrlLine = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='));
const dbUrl = dbUrlLine?.split('=')[1]?.trim();

if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });

client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mock_tests' ORDER BY ordinal_position"))
  .then((result) => {
    console.log('Columns:', result.rows.map((r) => r.column_name).join(', '));
    return client.query(`
      ALTER TABLE mock_tests 
      ADD COLUMN IF NOT EXISTS correct_marks integer DEFAULT 4 NOT NULL,
      ADD COLUMN IF NOT EXISTS incorrect_marks integer DEFAULT -1 NOT NULL,
      ADD COLUMN IF NOT EXISTS unattempted_marks integer DEFAULT 0 NOT NULL
    `);
  })
  .then(() => {
    console.log('Marking scheme columns ensured');
    return client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mock_tests' ORDER BY ordinal_position");
  })
  .then((result) => {
    console.log('Updated columns:', result.rows.map((r) => r.column_name).join(', '));
    client.end();
  })
  .catch((e) => {
    console.error('Error:', e.message);
    client.end();
    process.exit(1);
  });
