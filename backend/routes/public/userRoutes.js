// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, 
  verifyUser, 
  loginUserController , 
  forgotPassword,
  verifyRecoveryOTP,
  resetPasswordController,
  resendRecoveryOTP, resendActivationOTPController, 
  getUserIdByEmail,
  getProfile,
  putProfile,
  putPassword,
 
} = require('../../controllers/public/userController');

// ─── Auth ──────────────────────────────────────────────────
router.post('/register', registerUser);
router.post('/verify-otp', verifyUser);
router.post('/login', loginUserController);
// ─── Recuperación de contraseña ────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/verify-recovery-otp', verifyRecoveryOTP);
router.post('/reset-password', resetPasswordController);
router.post('/resend-recovery-otp', resendRecoveryOTP);
// ─── Activación de cuenta ──────────────────────────────────
router.post('/resend-activation-otp', resendActivationOTPController);
router.post('/get-user-id', getUserIdByEmail); // ← nueva ruta

// ─── Perfil ────────────────────────────────────────────────
router.get('/profile/:id',             getProfile);
router.put('/profile/:id',             putProfile);
router.put('/profile/:id/password',    putPassword);   // ← nueva ruta contraseña

module.exports = router;
