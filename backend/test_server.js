require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
console.log('🚀 Iniciando servidor de prueba...');

// ──────────────── 1. BASE MÍNIMA (siempre activa) ────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ruta de prueba para verificar que el servidor responde
app.get('/ping', (req, res) => res.json({ ok: true, message: 'pong' }));

// ──────────────── 2. HELMET (descomentar para probar) ────────────────
// const helmet = require('helmet');
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   contentSecurityPolicy: false,
// }));
// app.disable('x-powered-by');

// ──────────────── 3. SESIONES Y PASSPORT (descomentar para probar) ────
// const session = require('express-session');
// const passport = require('./config/passport');
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'secreto_temporal',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false, httpOnly: true, maxAge: 3600000 }
// }));
// app.use(passport.initialize());
// app.use(passport.session());

// ──────────────── 4. ARCHIVOS ESTÁTICOS (descomentar para probar) ────
// const path = require('path');
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────── 5. RUTAS PÚBLICAS (descomentar grupo a grupo) ──────
// const userRoutes = require('./routes/public/userRoutes');
// const authRoutes = require('./routes/public/authRoutes');
// app.use('/api/users', userRoutes);
// app.use('/api/auth', authRoutes);

// const misionRoutes = require('./routes/public/misionRoutes');
// const visionRoutes = require('./routes/public/visionRoutes');
// const valoresRoutes = require('./routes/public/valoresRoutes');
// app.use('/api/public', misionRoutes);
// app.use('/api/public', visionRoutes);
// app.use('/api/public', valoresRoutes);

// const redesRoutes = require('./routes/public/redesRoutes');
// const empresaRoutes = require('./routes/public/empresaRoutes');
// const ubicacionRoutes = require('./routes/public/ubicacionRoutes');
// const contactoRoutes = require('./routes/public/contactoRoutes');
// app.use('/api/redes-sociales', redesRoutes);
// app.use('/api/empresa', empresaRoutes);
// app.use('/api/ubicacion', ubicacionRoutes);
// app.use('/api/contactos', contactoRoutes);

// const antecedentesRoutes = require('./routes/public/antecedentesRoutes');
// app.use('/api/public/antecedentes', antecedentesRoutes);

// const publicProductosRoutes = require('./routes/public/productosRoutes');
// app.use('/api/public/productos', publicProductosRoutes);

// ──────────────── 6. RUTAS CLIENTE (descomentar después) ──────────────
// const productosClientRoutes = require('./routes/client/productosRoutes');
// const borradoresClienteRoutes = require('./routes/client/borradores');
// const carritoRoutes = require('./routes/client/carritoRoutes');
// const homeRoutes = require('./routes/client/homeRoutes');
// const checkoutRoutes = require('./routes/client/checkoutRoutes');
// app.use('/api/client/productos', productosClientRoutes);
// app.use('/api/client/borradores', borradoresClienteRoutes);
// app.use('/api/client/carrito', carritoRoutes);
// app.use('/api/client/home', homeRoutes);
// app.use('/api/client/checkout', checkoutRoutes);

// ──────────────── 7. RUTAS ADMIN (descomentar después) ────────────────
// (aquí pondrías todas tus rutas de admin, pero las omito por brevedad)

// ──────────────── INICIAR SERVIDOR ───────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de prueba en puerto ${PORT}`);
  console.log('🔍 Endpoints disponibles:');
  console.log('   GET /ping');
  // Aquí puedes agregar logs de las rutas que vayas activando
});