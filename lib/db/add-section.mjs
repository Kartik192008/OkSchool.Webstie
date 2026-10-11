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

console.log('Using DATABASE_URL:', dbUrl.replace(/\/\/.*@/, '//***@'));

const client = new Client({ connectionString: dbUrl });

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
