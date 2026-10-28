// backend/routes/admin/solicitudesEliminacionRoutes.js
// Solo administradores con sesión (token) pueden ver y atender las solicitudes.
const express = require('express');
const router = express.Router();
const verificarToken = require('../../src/middlewares/auth');
const { listar, atender, rechazar } = require('../../controllers/admin/solicitudesEliminacionController');

const soloAdmin = (req, res, next) =>
  req.usuario?.rol === 'administrador' ? next() : res.status(403).json({ message: 'Solo administradores' });

router.use(verificarToken, soloAdmin);

router.get('/', listar);
router.patch('/:id/atender', atender);
router.patch('/:id/rechazar', rechazar);

module.exports = router;
