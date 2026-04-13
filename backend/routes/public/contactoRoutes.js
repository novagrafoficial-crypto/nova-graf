// backend/routes/public/contactoRoutes.js
const express = require('express');
const router  = express.Router();
const contactoController = require('../../controllers/public/contactoController');

// GET /api/contactos
router.get('/', contactoController.getContactos);

module.exports = router;