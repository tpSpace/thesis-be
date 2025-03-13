require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATASOURCE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase PostgreSQL...');
    const client = await pool.connect();
    
    // Test basic connectivity
    const result = await client.query('SELECT NOW() as now');
    console.log('✅ Successfully connected to the database!');
    console.log('📅 Database time:', result.rows[0].now);
    
    // Test database permissions
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
    `);
    console.log('📚 Available schemas:', schema)
  } catch (error) {
    console.error('❌ Failed to connect to the database:', error.message);
  }
}

testConnection();