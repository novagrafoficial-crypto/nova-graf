const express = require('express');
const router = express.Router();

const { generarRespaldo } = require('../../controllers/admin/moduloAdminController');

router.get('/', generarRespaldo);

module.exports = router;

