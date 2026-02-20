// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, verifyUser, loginUserController  } = require('../../controllers/public/userController');

router.post('/register', registerUser);
router.post('/verify-otp', verifyUser);
router.post('/login', loginUserController);

module.exports = router;
