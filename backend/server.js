const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar CORS para permitir que el frontend se conecte
app.use(cors());
app.use(express.json());

// Rutas públicas
const userRoutes = require('./routes/public/userRoutes');  

// Carpeta pública para servir imágenes subidas

// Rutas para administración


// Rutas para usuarios registrados


// Registramos todas las rutas en el servidor
// Rutas públicas
app.use('/api/users', userRoutes);       

// Rutas admin
const marcasRoutes = require('./routes/admin/marcasRoutes');
app.use('/api/admin/marcas', marcasRoutes);
const categoriasRoutes = require("./routes/admin/categoriasRoutes");
app.use("/api/admin/categorias", categoriasRoutes);
const subcategoriasRoutes = require("./routes/admin/subcategoriasRoutes");
app.use("/api/admin/subcategorias", subcategoriasRoutes);
const productosRoutes = require("./routes/admin/productosRoutes");
app.use("/api/admin/productos", productosRoutes);
const usuariosRoutes = require("./routes/admin/usuariosRoutes");
app.use("/api/admin/usuarios", usuariosRoutes);
// Ruta para gestionar el perfil de usuario


// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
