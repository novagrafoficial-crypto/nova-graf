require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ← Conectar a MongoDB al arrancar
connectDB();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());


/* ================================
   CARPETA PÚBLICA PARA IMÁGENES
================================ */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================================
   RUTAS PÚBLICAS
================================ */

/* ================================
   RUTAS ADMIN
================================ */
const marcasRoutes = require('./routes/admin/marcasRoutes');
const categoriasRoutes = require('./routes/admin/categoriasRoutes');
const subcategoriasRoutes = require('./routes/admin/subcategoriasRoutes');
const productosRoutes = require('./routes/admin/productosRoutes');
const usuariosRoutes = require('./routes/admin/usuariosRoutes');

app.use('/api/admin/marcas', marcasRoutes);
app.use('/api/admin/categorias', categoriasRoutes);
app.use('/api/admin/subcategorias', subcategoriasRoutes);
app.use('/api/admin/productos', productosRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);

/* ================================
   RUTAS USUARIOS REGISTRADOS
================================ */
// Aquí puedes agregar rutas protegidas si tienes algo como perfil
// const perfilRoutes = require('./routes/user/perfilRoutes');
// app.use('/api/user/perfil', perfilRoutes);

/* ================================
   ARRANCAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});