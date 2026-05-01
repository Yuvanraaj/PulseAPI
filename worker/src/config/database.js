const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
