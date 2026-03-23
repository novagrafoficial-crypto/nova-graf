const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('🚀 Conexión exitosa a PostgreSQL local'))
  .catch(err => console.error('❌ Error al conectar:', err.stack));

module.exports = pool;