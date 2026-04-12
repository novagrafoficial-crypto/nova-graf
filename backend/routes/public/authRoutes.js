const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const { generarToken } = require('../../utils/jwt');  // ← AGREGAR

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── GOOGLE ───────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=google`);

      if (!user) {
        const errorCode = info?.message || 'google';
        return res.redirect(`${FRONTEND_URL}/login?error=${errorCode}`);
      }

      req.logIn(user, (err) => {
        if (err) return res.redirect(`${FRONTEND_URL}/login?error=google`);
        const userData = {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          correo_electronico: user.correo_electronico,
          rol: user.rol,
        };
        const token = generarToken(userData);  // ← GENERAR TOKEN
        const encoded = encodeURIComponent(JSON.stringify({ user: userData, token }));
        res.redirect(`${FRONTEND_URL}/auth/callback?data=${encoded}`);  // ← CAMBIAR A 'data'
      });
    })(req, res, next);
  }
);

// ─── FACEBOOK ─────────────────────────────────────────────
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
  (req, res, next) => {
    passport.authenticate('facebook', (err, user, info) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=facebook`);

      if (!user) {
        const errorCode = info?.message || 'facebook';
        return res.redirect(`${FRONTEND_URL}/login?error=${errorCode}`);
      }

      req.logIn(user, (err) => {
        if (err) return res.redirect(`${FRONTEND_URL}/login?error=facebook`);
        const userData = {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          correo_electronico: user.correo_electronico,
          rol: user.rol,
        };
        const token = generarToken(userData);
        const encoded = encodeURIComponent(JSON.stringify({ user: userData, token }));
        res.redirect(`${FRONTEND_URL}/auth/callback?data=${encoded}`);
      });
    })(req, res, next);
  }
);

module.exports = router;