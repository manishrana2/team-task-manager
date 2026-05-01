const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSetup() {
  try {
    console.log('Connecting to database...');
    
    // Read files
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    const mig2Sql = fs.readFileSync(path.join(__dirname, '../../database/migration_v2.sql'), 'utf8');
    const mig3Sql = fs.readFileSync(path.join(__dirname, '../../database/migration_v3.sql'), 'utf8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');

    console.log('Running schema.sql...');
    await pool.query(schemaSql);
    
    console.log('Running migration_v2.sql...');
    await pool.query(mig2Sql);
    
    console.log('Running migration_v3.sql...');
    await pool.query(mig3Sql);

    console.log('Running seed.sql...');
    try {
      await pool.query(seedSql);
      console.log('Seed data inserted successfully!');
    } catch (seedErr) {
      if (seedErr.code === '23505') {
        console.log('Seed data already exists (ignoring duplicate error).');
      } else {
        throw seedErr;
      }
    }

    console.log('✅ Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up database:', err);
    process.exit(1);
  }
}

runSetup();
