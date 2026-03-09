require('dotenv').config();
const express = require('express');
const cors = require('cors');

const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db'); 
const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================================
   CARPETA PÚBLICA PARA IMÁGENES
================================ */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas Publicas
const userRoutes = require('./routes/public/userRoutes');
const authRoutes = require('./routes/public/authRoutes');
const misionRoutes = require('./routes/public/misionRoutes');
const visionRoutes = require('./routes/public/visionRoutes');


// Rutas públicas 

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', misionRoutes);
app.use('/api/public', visionRoutes);


/* ================================
   RUTAS ADMIN
================================ */
const marcasRoutes = require('./routes/admin/marcasRoutes');
const categoriasRoutes = require('./routes/admin/categoriasRoutes');
const subcategoriasRoutes = require('./routes/admin/subcategoriasRoutes');
const productosRoutes = require('./routes/admin/productosRoutes');
const usuariosRoutes = require('./routes/admin/usuariosRoutes');
const moduloAdminRoutes = require('./routes/admin/moduloAdminRoutes');
const publicacionRoutes = require('./routes/admin/publicacionRoutes');

app.use('/api/admin/marcas', marcasRoutes);
app.use('/api/admin/categorias', categoriasRoutes);
app.use('/api/admin/subcategorias', subcategoriasRoutes);
app.use('/api/admin/productos', productosRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/admin/modulo', moduloAdminRoutes );
app.use('/api', publicacionRoutes);




app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});