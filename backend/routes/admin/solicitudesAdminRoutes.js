const express = require('express');
const router = express.Router();
const solicitudesModel = require('../../models/client/solicitudesModel');
const verificarToken = require('../../src/middlewares/auth'); // debería también verificar rol admin

// Middleware para asegurar que es admin (puedes crearlo aparte)
const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

router.get('/', verificarToken, esAdmin, async (req, res) => {
  try {
    const { estado } = req.query;
    const solicitudes = await solicitudesModel.obtenerTodasSolicitudes(estado);
    res.json(solicitudes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
});

router.post('/:id/propuestas', verificarToken, esAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { imagen_url, descripcion } = req.body;
    if (!imagen_url) return res.status(400).json({ message: 'Falta imagen' });
    const propuesta = await solicitudesModel.agregarPropuesta(id, imagen_url, descripcion);
    // Notificar al cliente (crear registro en notificaciones o enviar email)
    res.status(201).json(propuesta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar propuesta' });
  }
});

module.exports = router;