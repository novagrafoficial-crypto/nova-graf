require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const path    = require('node:path');
const helmet  = require('helmet');

// 🔒 Middlewares de autenticación
const verificarToken = require('./src/middlewares/auth');
const verificarAdmin = require('./src/middlewares/verificarAdmin');
// const detectarAtaque = require('./src/middlewares/rasp'); // opcional RASP

const app = express();

// ─── 1. CORS ───────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Id'],
}));

// ─── 2. PREFLIGHT ──────────────────────────────────────────
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// ─── 3. HELMET ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.disable('x-powered-by');

// ─── 4. BODY PARSERS ───────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── 5. SESIÓN ─────────────────────────────────────────────
// saveUninitialized: true es necesario para que Google OAuth
// pueda guardar el parámetro "state" antes de redirigir a Google.
// Con false, la cookie no se envía y el callback falla.
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: true,   // ← Requerido para Google OAuth
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true solo con HTTPS en producción
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── 6. ARCHIVOS ESTÁTICOS ─────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── 7. RUTAS PÚBLICAS ─────────────────────────────────────
const userRoutes            = require('./routes/public/userRoutes');
const authRoutes            = require('./routes/public/authRoutes');
const misionRoutes          = require('./routes/public/misionRoutes');
const visionRoutes          = require('./routes/public/visionRoutes');
const valoresRoutes         = require('./routes/public/valoresRoutes');
const redesRoutes           = require('./routes/public/redesRoutes');
const empresaRoutes         = require('./routes/public/empresaRoutes');
const ubicacionRoutes       = require('./routes/public/ubicacionRoutes');
const contactoRoutes        = require('./routes/public/contactoRoutes');
const antecedentesRoutes    = require('./routes/public/antecedentesRoutes');
const publicProductosRoutes = require('./routes/public/productosRoutes');
const portafolioRoutes      = require('./routes/public/portafolioRoutes');

app.use('/api/users',               userRoutes);
app.use('/api/auth',                authRoutes);
app.use('/api/public',              misionRoutes);
app.use('/api/public',              visionRoutes);
app.use('/api/public',              valoresRoutes);
app.use('/api/redes-sociales',      redesRoutes);
app.use('/api/empresa',             empresaRoutes);
app.use('/api/ubicacion',           ubicacionRoutes);
app.use('/api/contactos',           contactoRoutes);
app.use('/api/public/antecedentes', antecedentesRoutes);
app.use('/api/public/productos',    publicProductosRoutes);
app.use('/api/public',              portafolioRoutes);

// ─── 8. RUTAS CLIENTE ──────────────────────────────────────
const productosClientRoutes   = require('./routes/client/productosRoutes');
const borradoresClienteRoutes = require('./routes/client/borradores');
const carritoRoutes           = require('./routes/client/carritoRoutes');
const homeRoutes              = require('./routes/client/homeRoutes');
const checkoutRoutes          = require('./routes/client/checkoutRoutes');
const pedidosRoutes           = require('./routes/client/pedidosRoutes');
const solicitudDisenoRoutes   = require('./routes/client/solicitudDisenoRoutes');

app.use('/api/client/productos',  productosClientRoutes);
app.use('/api/client/borradores', borradoresClienteRoutes);
app.use('/api/client/carrito',    carritoRoutes);
app.use('/api/client/home',       homeRoutes);
app.use('/api/client/checkout',   checkoutRoutes);
app.use('/api/client/pedidos',    pedidosRoutes);
app.use('/api',                   solicitudDisenoRoutes);

// ─── 9. PROTECCIÓN RUTAS ADMIN ─────────────────────────────
// Todas las rutas /api/admin requieren autenticación y rol admin
app.use('/api/admin', verificarAdmin);

// ─── 10. RUTAS ADMIN — EMPRESA ─────────────────────────────
const adminMisionRoutes       = require('./routes/admin/empresa/adminMisionRoutes');
const adminAntecedentesRoutes = require('./routes/admin/empresa/adminAntecedentesRoutes');
const adminContactosRoutes    = require('./routes/admin/empresa/adminContactosRoutes');
const adminPoliticasRoutes    = require('./routes/admin/empresa/adminPoliticasRoutes');
const adminRedesRoutes        = require('./routes/admin/empresa/adminRedesRoutes');
const adminUbicacionRoutes    = require('./routes/admin/empresa/adminUbicacionRoutes');
const adminValoresRoutes      = require('./routes/admin/empresa/adminValoresRoutes');
const adminVisionRoutes       = require('./routes/admin/empresa/adminVisionRoutes');

app.use('/api/admin/mision',       adminMisionRoutes);
app.use('/api/admin/antecedentes', adminAntecedentesRoutes);
app.use('/api/admin/contactos',    adminContactosRoutes);
app.use('/api/admin/politicas',    adminPoliticasRoutes);
app.use('/api/admin/redes',        adminRedesRoutes);
app.use('/api/admin/ubicacion',    adminUbicacionRoutes);
app.use('/api/admin/valores',      adminValoresRoutes);
app.use('/api/admin/vision',       adminVisionRoutes);

// ─── 11. RUTAS ADMIN — CATÁLOGOS ───────────────────────────
const marcasRoutes           = require('./routes/admin/marcasRoutes');
const categoriasRoutes       = require('./routes/admin/categoriasRoutes');
const subcategoriasRoutes    = require('./routes/admin/subcategoriasRoutes');
const productosRoutes        = require('./routes/admin/productosRoutes');
const usuariosRoutes         = require('./routes/admin/usuariosRoutes');
const moduloAdminRoutes      = require('./routes/admin/moduloAdminRoutes');
const publicacionRoutes      = require('./routes/admin/publicacionRoutes');
const AtributosproducRoutes  = require('./routes/admin/AtributosproducRoutes');
const productoProveedoresRoutes = require('./routes/admin/productoProveedoresRoutes');

app.use('/api/admin/marcas',        marcasRoutes);
app.use('/api/admin/categorias',    categoriasRoutes);
app.use('/api/admin/subcategorias', subcategoriasRoutes);
app.use('/api/admin/productos',     productosRoutes);
app.use('/api/admin/usuarios',      usuariosRoutes);
app.use('/api/admin/modulo',        moduloAdminRoutes);
app.use('/api',                     publicacionRoutes);
app.use('/api/admin/Atributosproduc', AtributosproducRoutes);
app.use('/api/admin',               productoProveedoresRoutes);

// ─── 12. RUTAS ADMIN — INVENTARIO Y MÁS ───────────────────
const inventarioRoutes       = require('./routes/admin/inventarioRoutes');
const monitoreoRoutes        = require('./routes/admin/monitoreoRoutes');
const proveedorRoutes        = require('./routes/admin/proveedorRoutes');
const reabastecimientoRoutes = require('./routes/admin/reabastecimientoRoutes');

app.use('/api/admin/inventario',       inventarioRoutes);
app.use('/api/admin/monitoreo',        monitoreoRoutes);
app.use('/api/admin/proveedores',      proveedorRoutes);
app.use('/api/admin/reabastecimiento', reabastecimientoRoutes);

// ─── 13. INICIAR SERVIDOR ──────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});