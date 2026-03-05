const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const Usuario = require('../models/public/Usuario');
const { findOrCreateGoogleUser } = require('../models/public/userModel');

// ─── GOOGLE ───────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const nombre = profile.name.givenName || 'Usuario';
    const apellido_paterno = profile.name.familyName || '';
    const googleId = profile.id;

    const user = await findOrCreateGoogleUser({
      googleId,
      nombre,
      apellido_paterno,
      email
    });

    return done(null, user);
  } catch (error) {
    // Error controlado: correo ya registrado con otro proveedor
    if (error.message === 'email_local' || error.message === 'email_facebook') {
      return done(null, false, { message: error.message });
    }
    return done(error, null);
  }
}));

// ─── FACEBOOK ─────────────────────────────────────────────
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value || `fb_${profile.id}@novagraf.com`;
    const nombre = profile.name?.givenName || 'Usuario';
    const apellido_paterno = profile.name?.familyName || '';

    // Verificar si ya existe
    let user = await Usuario.findOne({ correo_electronico: email });

    if (user) {
      if (user.proveedor === 'local')
        return done(null, false, { message: 'email_local' });
      if (user.proveedor === 'google')
        return done(null, false, { message: 'email_google' });
      // Ya es cuenta Facebook → login directo
      return done(null, {
        id_usuario: user._id,
        nombre: user.nombre,
        correo_electronico: user.correo_electronico,
        rol: user.rol
      });
    }

    // Crear nuevo usuario con Facebook
    const newUser = await Usuario.create({
      nombre,
      apellido_paterno,
      correo_electronico: email,
      nombre_usuario: email,
      activo: true,
      rol: 'cliente',
      proveedor: 'facebook',
    });

    return done(null, {
      id_usuario: newUser._id,
      nombre: newUser.nombre,
      correo_electronico: newUser.correo_electronico,
      rol: newUser.rol
    });
  } catch (error) {
    return done(error, null);
  }
}));

// ─── SESIÓN ───────────────────────────────────────────────
// Guardar en sesión — usamos _id de MongoDB (string)
passport.serializeUser((user, done) => {
  done(null, user.id_usuario.toString()); // ← toString() importante en MongoDB
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Usuario.findById(id);
    if (!user) return done(null, false);
    done(null, {
      id_usuario: user._id,
      nombre: user.nombre,
      correo_electronico: user.correo_electronico,
      rol: user.rol
    });
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;