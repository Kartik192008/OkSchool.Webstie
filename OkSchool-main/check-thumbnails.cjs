const { Pool } = require("pg");

const url = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: url });

pool.query("SELECT id, title, thumbnail_url FROM documents ORDER BY id")
  .then((res) => {
    console.log("Documents:");
    res.rows.forEach((row) => {
      console.log(`  id=${row.id}, title=${row.title}, thumbnail=${row.thumbnail_url}`);
    });
    return pool.end();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
