const { Pool } = require('pg');
require('dotenv').config();

// Connect to Vercel Postgres using POSTGRES_URL or fallback to local connection string
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/team_task_manager',
  ssl: (process.env.POSTGRES_URL || process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

const queryWrapper = {
  query: async (sql, params = []) => {
    // 1. Convert MySQL '?' placeholders to Postgres '$1, $2'
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    // 2. Automatically append RETURNING id for INSERT statements if not present
    const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT INTO');
    if (isInsert && !pgSql.toUpperCase().includes('RETURNING ID')) {
      pgSql += ' RETURNING id';
    }

    // Execute the query
    const result = await pool.query(pgSql, params);

    // 4. Simulate mysql2 response structure [rows, fields]
    // For INSERT, attach the returned ID to simulate result.insertId
    if (isInsert && result.rows.length > 0) {
      result.insertId = result.rows[0].id;
    }
    
    // Simulate mysql2 affectedRows
    result.affectedRows = result.rowCount;

    // In mysql2, SELECT returns [rows], INSERT/UPDATE returns [resultObject]
    // We will just return the result object enriched with rows so destructuring works
    const finalResult = result.rows;
    finalResult.insertId = result.insertId;
    finalResult.affectedRows = result.rowCount;

    return [finalResult, result.fields];
  }
};

module.exports = queryWrapper;
