require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const path = require('path');

// 🔒 Middleware de autenticación
const verificarToken = require('./src/middlewares/auth');

// const detectarAtaque = require('./src/middlewares/rasp'); // opcional

const app = express();
const PORT = process.env.PORT || 5000;

/* ================================
   CORS (solo una vez)
================================ */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
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
   RUTAS PÚBLICAS
================================ */
const userRoutes = require('./routes/public/userRoutes');
const authRoutes = require('./routes/public/authRoutes');
const misionRoutes = require('./routes/public/misionRoutes');
const visionRoutes = require('./routes/public/visionRoutes');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', misionRoutes);
app.use('/api/public', visionRoutes);

/* ================================
   RASP (opcional)
================================ */
// app.use('/api', detectarAtaque);

/* ================================
   PROTEGER TODO ADMIN 🔥
================================ */
//app.use('/api/admin', verificarToken);

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

const adminMisionRoutes = require('./routes/admin/empresa/adminMisionRoutes');
const adminAntecedentesRoutes = require("./routes/admin/empresa/adminAntecedentesRoutes");
const adminContactosRoutes = require("./routes/admin/empresa/adminContactosRoutes");
const adminPoliticasRoutes = require("./routes/admin/empresa/adminPoliticasRoutes");
const adminRedesRoutes = require("./routes/admin/empresa/adminRedesRoutes");
const adminUbicacionRoutes = require("./routes/admin/empresa/adminUbicacionRoutes");
const adminValoresRoutes = require("./routes/admin/empresa/adminValoresRoutes");
const inventarioRoutes=require('./routes/admin/inventarioRoutes')
const adminVisionRoutes = require('./routes/admin/empresa/adminVisionRoutes');
const MonitoreoRoutes = require('./routes/admin/MonitoreoRoutes');


// Empresa
app.use("/api/admin/antecedentes", adminAntecedentesRoutes);
app.use('/api/admin/vision', adminVisionRoutes);
app.use("/api/admin/contactos", adminContactosRoutes);
app.use("/api/admin/politicas", adminPoliticasRoutes);
app.use("/api/admin/redes", adminRedesRoutes);
app.use("/api/admin/ubicacion", adminUbicacionRoutes);
app.use("/api/admin/valores", adminValoresRoutes);
app.use('/api/admin/mision', adminMisionRoutes);
app.use('/api/admin/inventario', inventarioRoutes);
app.use('/api/admin/Monitoreo', MonitoreoRoutes); 

// Catálogos y módulos
app.use('/api/admin/marcas', marcasRoutes);
app.use('/api/admin/categorias', categoriasRoutes);
app.use('/api/admin/subcategorias', subcategoriasRoutes);
app.use('/api/admin/productos', productosRoutes);
app.use('/api/admin/usuarios', usuariosRoutes);
app.use('/api/admin/modulo', moduloAdminRoutes);

// Publicaciones (si quieres que sea público, cámbialo a /api/public)
app.use('/api/admin/publicaciones', publicacionRoutes);

/* ================================
   INICIAR SERVIDOR
================================ */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});