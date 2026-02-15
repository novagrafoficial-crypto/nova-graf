// db.js
const { Client } = require('pg');
require('dotenv').config();  // Cargar las variables de entorno desde el archivo .env

// Obtener la URL de conexión desde la variable de entorno
const connectionString = process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Requerido por Render (para permitir SSL)
  },
});

// Conectar a la base de datos
client.connect()
  .then(() => console.log('Conexión exitosa a la base de datos PostgreSQL en Render'))
  .catch(err => console.error('Error al conectar a la base de datos:', err.stack));

module.exports = client;
