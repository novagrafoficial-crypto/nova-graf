const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS para permitir que el frontend se conecte
app.use(cors());
app.use(express.json());

// Rutas públicas
const userRoutes = require('./routes/public/userRoutes');  
const misionRoutes = require('./routes/public/misionRoutes');
const visionRoutes = require('./routes/public/visionRoutes');

// Rutas para administración



// Rutas para usuarios registrados


// Rutas públicas
app.use('/api/users', userRoutes);  
app.use('/api/public', misionRoutes); 
app.use('/api/public', visionRoutes); 

// Ruta (admin)

// Ruta para gestionar el perfil de usuario


// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
