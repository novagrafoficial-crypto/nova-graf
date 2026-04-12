const express = require('express');
const router = express.Router();
const { listarPortafolio } = require('../../controllers/public/portafolioController');

router.get('/portafolio', listarPortafolio);

module.exports = router;