const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const jwt = require('jsonwebtoken');                     // ← NUEVO

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET;

// ─── GOOGLE ───────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) return res.redirect(`${FRONTEND_URL}/login?error=google`);

      if (!user) {
        const errorCode = info?.message || 'google';
        return res.redirect(`${FRONTEND_URL}/login?error=${errorCode}`);
      }

      req.logIn(user, async (err) => {                   // ← se usa async para await si es necesario
        if (err) return res.redirect(`${FRONTEND_URL}/login?error=google`);

        // ✅ Generar token JWT
        const token = jwt.sign(
          { id_usuario: user.id_usuario, rol: user.rol },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const userData = {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          correo_electronico: user.correo_electronico,
          rol: user.rol
        };

        const encodedUser = encodeURIComponent(JSON.stringify(userData));
        const encodedToken = encodeURIComponent(token);  // ← token también codificado

        // ✅ Redirigir con user y token
        res.redirect(`${FRONTEND_URL}/auth/callback?user=${encodedUser}&token=${encodedToken}`);
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

      req.logIn(user, async (err) => {
        if (err) return res.redirect(`${FRONTEND_URL}/login?error=facebook`);

        // ✅ Generar token JWT
        const token = jwt.sign(
          { id_usuario: user.id_usuario, rol: user.rol },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        const userData = {
          id_usuario: user.id_usuario,
          nombre: user.nombre,
          correo_electronico: user.correo_electronico,
          rol: user.rol
        };

        const encodedUser = encodeURIComponent(JSON.stringify(userData));
        const encodedToken = encodeURIComponent(token);

        // ✅ Redirigir con user y token
        res.redirect(`${FRONTEND_URL}/auth/callback?user=${encodedUser}&token=${encodedToken}`);
      });
    })(req, res, next);
  }
);

module.exports = router;