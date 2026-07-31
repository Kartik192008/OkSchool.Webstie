import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://postgres:K19112008k%40123@db.revrmdtnffgnmnqytedr.supabase.co:5432/postgres',
});

client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'mock_tests' ORDER BY ordinal_position"))
  .then((result) => {
    console.log('Columns:', result.rows.map((r) => r.column_name).join(', '));
    client.end();
  })
  .catch((e) => {
    console.error('Error:', e.message);
    client.end();
  });
