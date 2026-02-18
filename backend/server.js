const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS para permitir que el frontend se conecte
app.use(cors());
app.use(express.json());

// Rutas públicas
const userRoutes = require('./routes/public/userRoutes');  



// Rutas para administración



// Rutas para usuarios registrados


// Registramos todas las rutas en el servidor
// Rutas públicas
app.use('/api/users', userRoutes);       

// Ruta (admin)

// Ruta para gestionar el perfil de usuario


// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
