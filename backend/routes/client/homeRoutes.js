const express = require('express');
const router = express.Router();
const homeController = require('../../controllers/client/homeController');

// GET /api/client/home → solo portafolio + stats
router.get('/', homeController.getHomeData);

module.exports = router;