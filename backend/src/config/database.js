const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

/**
 * Execute a parameterized query.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool for transactions.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
