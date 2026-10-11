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
  .then(() => client.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      supabase_user_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `))
  .then(() => client.query(`
    CREATE TABLE IF NOT EXISTS user_visits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
      page TEXT NOT NULL,
      action TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `))
  .then(() => {
    console.log('User tables created');
    client.end();
  })
  .catch((e) => {
    console.error('Error:', e.message);
    client.end();
    process.exit(1);
  });
