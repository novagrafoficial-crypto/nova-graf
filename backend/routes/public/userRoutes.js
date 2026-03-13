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
  getUserIdByEmail
 
} = require('../../controllers/public/userController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyUser);
router.post('/login', loginUserController);

router.post('/forgot-password', forgotPassword);
router.post('/verify-recovery-otp', verifyRecoveryOTP);
router.post('/reset-password', resetPasswordController);
router.post('/resend-recovery-otp', resendRecoveryOTP);
router.post('/resend-activation-otp', resendActivationOTPController);
router.post('/get-user-id', getUserIdByEmail); // ← nueva ruta


router.get('/profile/:id', async (req, res) => {
  try {
    const user = await getUserProfile(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error.message); // ✅ usa error
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    const updated = await updateUserProfile(req.params.id, req.body);
    res.json({ message: 'Perfil actualizado', user: updated });
  } catch (error) {
    console.error('Error al actualizar perfil:', error.message); // ✅ usa error
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

module.exports = router;
