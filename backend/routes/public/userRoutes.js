const express = require('express');
const verificarToken = require('../../src/middlewares/auth');
const router = express.Router();
const {
  limitLogin, limitOtp, limitCorreo, limitReenvio, limitRegistro, limitLookup, limitReset,
} = require('../../utils/rateLimit');
const {
  registerUser,
  verifyUser,
  loginUserController,
  forgotPassword,
  verifyRecoveryOTP,
  resetPasswordController,
  resendRecoveryOTP,
  resendActivationOTPController,
  getUserIdByEmail,
  getProfile,
  putProfile,
  putPassword,
} = require('../../controllers/public/userController');

// ─── Autenticación ─────────────────────────────────────────
router.post('/register',              limitRegistro, registerUser);
router.post('/verify-otp',            limitOtp, verifyUser);
router.post('/login',                 limitLogin, loginUserController);

// ─── Recuperación de contraseña ────────────────────────────
router.post('/forgot-password',       limitCorreo, forgotPassword);
router.post('/verify-recovery-otp',   limitOtp, verifyRecoveryOTP);
router.post('/reset-password',        limitReset, resetPasswordController);
router.post('/resend-recovery-otp',   limitReenvio, resendRecoveryOTP);

// ─── Activación de cuenta ──────────────────────────────────
router.post('/resend-activation-otp', limitReenvio, resendActivationOTPController);
router.post('/get-user-id',           limitLookup, getUserIdByEmail);

// ─── Perfil (Autenticado)────────────────────────────────────────────
router.get('/profile/:id',            verificarToken, getProfile);
router.put('/profile/:id',            verificarToken, putProfile);
router.put('/profile/:id/password',   verificarToken, putPassword);

module.exports = router;
