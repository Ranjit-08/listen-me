require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      false,
});

async function migrate() {
  console.log('Running database migration...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('✅ Schema applied successfully');
    console.log('👤 Admin login → Email: admin@aura.com  Password: Admin@123456');
    console.log('⚠️  Change the admin password after first login!');
  } catch(e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  }
  await pool.end();
}

migrate();