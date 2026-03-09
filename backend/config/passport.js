const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db = require('./db');

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

    // Buscar si ya existe por correo
    const existing = await db.query(
      'SELECT id_usuario, nombre, correo_electronico, rol, proveedor FROM usuarios WHERE correo_electronico = $1',
      [email]
    );

    if (existing.rowCount > 0) {
      const user = existing.rows[0];
      if (user.proveedor === 'local')    return done(null, false, { message: 'email_local' });
      if (user.proveedor === 'facebook') return done(null, false, { message: 'email_facebook' });
      return done(null, user); // Ya es Google → login directo
    }

    // Crear nuevo usuario Google
    const result = await db.query(`
      INSERT INTO usuarios 
      (nombre, apellido_paterno, nombre_usuario, correo_electronico, activo, rol, proveedor, contrasena)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id_usuario, nombre, correo_electronico, rol
    `, [nombre, apellido_paterno, email, email, true, 'cliente', 'google', 'GOOGLE_AUTH']);

    return done(null, result.rows[0]);
  } catch (error) {
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

    // Buscar si ya existe por correo
    const existing = await db.query(
      'SELECT id_usuario, nombre, correo_electronico, rol, proveedor FROM usuarios WHERE correo_electronico = $1',
      [email]
    );

    if (existing.rowCount > 0) {
      const user = existing.rows[0];
      if (user.proveedor === 'local')  return done(null, false, { message: 'email_local' });
      if (user.proveedor === 'google') return done(null, false, { message: 'email_google' });
      return done(null, user); // Ya es Facebook → login directo
    }

    // Crear nuevo usuario Facebook
    const result = await db.query(`
      INSERT INTO usuarios
      (nombre, apellido_paterno, nombre_usuario, correo_electronico, activo, rol, proveedor, contrasena)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id_usuario, nombre, correo_electronico, rol
    `, [nombre, apellido_paterno, email, email, true, 'cliente', 'facebook', 'FACEBOOK_AUTH']);

    return done(null, result.rows[0]);
  } catch (error) {
    return done(error, null);
  }
}));

// ─── SESIÓN ───────────────────────────────────────────────
passport.serializeUser((user, done) => {
  done(null, user.id_usuario); // PostgreSQL usa número entero, no necesita toString()
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query(
      'SELECT id_usuario, nombre, correo_electronico, rol FROM usuarios WHERE id_usuario = $1',
      [id]
    );
    if (result.rowCount === 0) return done(null, false);
    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;