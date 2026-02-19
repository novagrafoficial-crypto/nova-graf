// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/public/userController');

// Ruta para registrar un nuevo usuario
router.post('/register', userController.registerUser);

module.exports = router;
