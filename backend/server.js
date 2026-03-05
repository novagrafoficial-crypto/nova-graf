require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/db'); 

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

// Sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Rutas Publicas
const userRoutes = require('./routes/public/userRoutes');
const authRoutes = require('./routes/public/authRoutes');
const misionRoutes = require('./routes/public/misionRoutes');
const visionRoutes = require('./routes/public/visionRoutes');


// Rutas Publicas



//Rutas Publicas
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', misionRoutes);
app.use('/api/public', visionRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});