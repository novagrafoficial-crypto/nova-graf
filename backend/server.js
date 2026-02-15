// backend/src/server.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');  // Importar las rutas de usuario

const app = express();
app.use(cors());

// Middleware para parsear el body en formato JSON
app.use(express.json());

// Usar las rutas
app.use('/api/users', userRoutes); // Rutas de usuarios en el endpoint /api/users

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
