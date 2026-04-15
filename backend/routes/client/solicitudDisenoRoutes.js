// backend/src/routes/solicitudDisenoRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/solicitudDisenoController');
const verificarToken = require('../../src/middlewares/auth'); // Ajusta la ruta

// Middleware para verificar si es admin (ajusta según tu lógica)
const esAdmin = async (req, res, next) => {
  // Aquí debes implementar la verificación de rol
  // Por ejemplo, consultando la BD o leyendo el token
  // Si tu middleware ya incluye el rol, puedes usarlo directamente
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

// Cliente
router.post('/client/solicitudes-diseno', verificarToken, controller.crearSolicitud);
router.get('/client/solicitudes-diseno', verificarToken, controller.misSolicitudes);
router.post('/client/solicitudes/:id/aprobar-propuesta', verificarToken, controller.aprobarPropuesta);

// Admin
router.get('/admin/solicitudes-diseno/pendientes', verificarToken, esAdmin, controller.getSolicitudesPendientes);
router.post('/admin/solicitudes/:id/propuestas', verificarToken, esAdmin, controller.subirPropuesta);
router.put('/admin/solicitudes/:id/costo', verificarToken, esAdmin, controller.asignarCosto);
router.put('/admin/solicitudes/:id/estado', verificarToken, esAdmin, controller.cambiarEstado);

module.exports = router;