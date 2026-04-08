require('newrelic');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const path = require('node:path');
const helmet = require('helmet');

const app = express();
app.disable('x-powered-by');

// Helmet con configuración permisiva para CORS en desarrollo
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Límites de payload
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/* ================================
   CORS y manejo explícito de OPTIONS
================================ */
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔥 Middleware para OPTIONS - DEBE IR ANTES DE CUALQUIER RUTA O MIDDLEWARE DE AUTENTICACIÓN
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.sendStatus(200);
});

/* ================================
   SESIONES Y PASSPORT
================================ */
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
const userRoutes           = require('./routes/public/userRoutes');
const authRoutes           = require('./routes/public/authRoutes');
const misionRoutes         = require('./routes/public/misionRoutes');
const visionRoutes         = require('./routes/public/visionRoutes');
const valoresRoutes        = require('./routes/public/valoresRoutes');
const redesRoutes          = require('./routes/public/redesRoutes');
const empresaRoutes        = require('./routes/public/empresaRoutes');
const ubicacionRoutes      = require('./routes/public/ubicacionRoutes');
const contactoRoutes       = require('./routes/public/contactoRoutes');
const antecedentesRoutes   = require('./routes/public/antecedentesRoutes');

app.use('/api/users',                  userRoutes);
app.use('/api/auth',                   authRoutes);
app.use('/api/public',                 misionRoutes);
app.use('/api/public',                 visionRoutes);
app.use('/api/public',                 valoresRoutes);
app.use('/api/redes-sociales',         redesRoutes);
app.use('/api/empresa',                empresaRoutes);
app.use('/api/ubicacion',              ubicacionRoutes);
app.use('/api/contactos',              contactoRoutes);
app.use('/api/public/antecedentes',    antecedentesRoutes);


/* ================================
   RUTAS CLIENTE
================================ */
const productosClientRoutes = require('./routes/client/productosRoutes');
const borradoresClienteRoutes = require('./routes/client/borradores');
const carritoRoutes = require('./routes/client/carritoRoutes');


app.use('/api/client/productos',       productosClientRoutes);
app.use('/api/client/borradores',      borradoresClienteRoutes);
app.use('/api/client/carrito',         carritoRoutes);

/* ================================
   RUTAS ADMIN
================================ */
const marcasRoutes         = require('./routes/admin/marcasRoutes');
const categoriasRoutes     = require('./routes/admin/categoriasRoutes');
const subcategoriasRoutes  = require('./routes/admin/subcategoriasRoutes');
const productosRoutes      = require('./routes/admin/productosRoutes');
const usuariosRoutes       = require('./routes/admin/usuariosRoutes');
const moduloAdminRoutes    = require('./routes/admin/moduloAdminRoutes');
const adminMisionRoutes       = require('./routes/admin/empresa/adminMisionRoutes');
const adminAntecedentesRoutes = require('./routes/admin/empresa/adminAntecedentesRoutes');
const adminContactosRoutes    = require('./routes/admin/empresa/adminContactosRoutes');
const adminPoliticasRoutes    = require('./routes/admin/empresa/adminPoliticasRoutes');
const adminRedesRoutes        = require('./routes/admin/empresa/adminRedesRoutes');
const adminUbicacionRoutes    = require('./routes/admin/empresa/adminUbicacionRoutes');
const adminValoresRoutes      = require('./routes/admin/empresa/adminValoresRoutes');
const inventarioRoutes        = require('./routes/admin/inventarioRoutes');
const adminVisionRoutes       = require('./routes/admin/empresa/adminVisionRoutes');
const monitoreoRoutes         = require('./routes/admin/monitoreoRoutes');
const proveedorRoutes         = require('./routes/admin/proveedoresRoutes');

//Admin Rutas del modulo de abastecimiento y publicacion
const publicacionRoutes       = require('./routes/admin/publicacionRoutes');
const reabastecimientoRoutes  = require('./routes/admin/reabastecimientoRoutes');

app.use('/api/admin/antecedentes',   adminAntecedentesRoutes);
app.use('/api/admin/vision',         adminVisionRoutes);
app.use('/api/admin/contactos',      adminContactosRoutes);
app.use('/api/admin/politicas',      adminPoliticasRoutes);
app.use('/api/admin/redes',          adminRedesRoutes);
app.use('/api/admin/ubicacion',      adminUbicacionRoutes);
app.use('/api/admin/valores',        adminValoresRoutes);
app.use('/api/admin/mision',         adminMisionRoutes);
app.use('/api/admin/inventario',     inventarioRoutes);
app.use('/api/admin/monitoreo',      monitoreoRoutes); 
app.use('/api/admin/proveedores',    proveedorRoutes);
app.use('/api/admin/marcas',         marcasRoutes);
app.use('/api/admin/categorias',     categoriasRoutes);
app.use('/api/admin/subcategorias',  subcategoriasRoutes);
app.use('/api/admin/productos',      productosRoutes);
app.use('/api/admin/usuarios',       usuariosRoutes);
app.use('/api/admin/modulo',         moduloAdminRoutes);

//Rutaas Admin Publicaciones y Reabastecimiento
app.use('/api',                      publicacionRoutes);
app.use('/api/public',               publicacionRoutes);
app.use('/api/admin/reabastecimiento', reabastecimientoRoutes);


/* ================================
   INICIAR SERVIDOR
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});