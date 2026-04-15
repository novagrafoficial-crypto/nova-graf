require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const path = require('path');

// 🔒 Middleware de autenticación
const verificarToken = require('./src/middlewares/auth');
const detectarAtaque = require('./src/middlewares/rasp'); // opcional

const app = express();
const PORT = process.env.PORT || 5000;

/* ================================
   CORS (solo una vez)
================================ */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ================================
   MIDDLEWARES GENERALES
================================ */
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ================================
   ARCHIVOS ESTÁTICOS
================================ */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ================================
   IMPORTS — RUTAS PÚBLICAS
================================ */
const userRoutes = require('./routes/public/userRoutes');
const authRoutes = require('./routes/public/authRoutes');
const misionRoutes = require('./routes/public/misionRoutes');
const visionRoutes = require('./routes/public/visionRoutes');

/* ================================
   IMPORTS — RUTAS ADMIN
================================ */
const marcasRoutes = require('./routes/admin/marcasRoutes');
const categoriasRoutes = require('./routes/admin/categoriasRoutes');
const subcategoriasRoutes = require('./routes/admin/subcategoriasRoutes');
const productosRoutes = require('./routes/admin/productosRoutes');
const usuariosRoutes = require('./routes/admin/usuariosRoutes');
const moduloAdminRoutes = require('./routes/admin/moduloAdminRoutes');
const publicacionRoutes = require('./routes/admin/publicacionRoutes');
const inventarioRoutes = require('./routes/admin/inventarioRoutes');
const MonitoreoRoutes = require('./routes/admin/MonitoreoRoutes');
const proveedoresRoutes = require('./routes/admin/proveedoresRoutes');
const AtributosproducRoutes = require('./routes/admin/AtributosproducRoutes');
const productoProveedoresRoutes = require('./routes/admin/productoProveedoresRoutes');

// Empresa
const adminMisionRoutes = require('./routes/admin/empresa/adminMisionRoutes');
const adminAntecedentesRoutes = require('./routes/admin/empresa/adminAntecedentesRoutes');
const adminContactosRoutes = require('./routes/admin/empresa/adminContactosRoutes');
const adminPoliticasRoutes = require('./routes/admin/empresa/adminPoliticasRoutes');
const adminRedesRoutes = require('./routes/admin/empresa/adminRedesRoutes');
const adminUbicacionRoutes = require('./routes/admin/empresa/adminUbicacionRoutes');
const adminValoresRoutes = require('./routes/admin/empresa/adminValoresRoutes');
const adminVisionRoutes = require('./routes/admin/empresa/adminVisionRoutes');

/* ================================
   RUTAS PÚBLICAS
================================ */
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', misionRoutes);
app.use('/api/public', visionRoutes);

// ✅ Rutas públicas para el frontend (Header, etc.)
app.use('/api/redes-sociales', adminRedesRoutes);
app.use('/api/ubicacion', adminUbicacionRoutes);
app.use('/api/contactos', adminContactosRoutes);

/* ================================
   RASP (opcional)
================================ */
// app.use('/api', detectarAtaque);

/* ================================
   PROTEGER TODO ADMIN 🔥
================================ */
// app.use('/api/admin', verificarToken);

/* ================================
   RUTAS ADMIN — EMPRESA
================================ */
app.use('/api/admin/antecedentes', adminAntecedentesRoutes);
app.use('/api/admin/vision', adminVisionRoutes);
app.use('/api/admin/contactos', adminContactosRoutes);
app.use('/api/admin/politicas', adminPoliticasRoutes);
app.use('/api/admin/redes', adminRedesRoutes);
app.use('/api/admin/ubicacion', adminUbicacionRoutes);
app.use('/api/admin/valores', adminValoresRoutes);
app.use('/api/admin/mision', adminMisionRoutes);

/* ================================
   RUTAS ADMIN — CATÁLOGOS
================================ */
app.use('/api/admin/marcas', marcasRoutes);
app.use('/api/admin/categorias', categoriasRoutes);
app.use('/api/admin/subcategorias', subcategoriasRoutes);
app.use('/api/admin/productos', productosRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/admin/modulo', moduloAdminRoutes);
app.use('/api/admin/publicaciones', publicacionRoutes);

/* ================================
   RUTAS ADMIN — INVENTARIO Y MÁS
================================ */
app.use('/api/admin/inventario', inventarioRoutes);
app.use('/api/admin/Monitoreo', MonitoreoRoutes);
app.use('/api/admin/proveedores', proveedoresRoutes);          // ✅ typo corregido
app.use('/api/admin/Atributosproduc', AtributosproducRoutes);
app.use('/api/admin', productoProveedoresRoutes);              // ✅ → /api/admin/productos/:id/proveedores

/* ================================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});