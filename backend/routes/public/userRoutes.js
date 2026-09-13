const express = require('express');
const verificarToken = require('../../src/middlewares/auth');
const router = express.Router();
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
router.post('/register',              registerUser);
router.post('/verify-otp',            verifyUser);
router.post('/login',                 loginUserController);

// ─── Recuperación de contraseña ────────────────────────────
router.post('/forgot-password',       forgotPassword);
router.post('/verify-recovery-otp',   verifyRecoveryOTP);
router.post('/reset-password',        resetPasswordController);
router.post('/resend-recovery-otp',   resendRecoveryOTP);

// ─── Activación de cuenta ──────────────────────────────────
router.post('/resend-activation-otp', resendActivationOTPController);
router.post('/get-user-id',           getUserIdByEmail);

// ─── Perfil (Autenticado)────────────────────────────────────────────
router.get('/profile/:id',            verificarToken, getProfile);
router.put('/profile/:id',            verificarToken, putProfile);
router.put('/profile/:id/password',   verificarToken, putPassword);

module.exports = router;