const express = require('express');
const router = express.Router();
const borradoresModel = require('../../models/client/borradoresModel');
const verificarToken = require('../../src/middlewares/auth');

// GET /api/client/borradores
router.get('/', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const borradores = await borradoresModel.obtenerBorradoresPorUsuario(usuarioId);
    res.json(borradores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener borradores' });
  }
});

// GET /api/client/borradores/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const borrador = await borradoresModel.obtenerBorradorPorId(req.params.id, usuarioId);
    if (!borrador) {
      return res.status(404).json({ message: 'Borrador no encontrado' });
    }
    res.json(borrador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener borrador' });
  }
});

// POST /api/client/borradores
router.post('/', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const { producto_id, variante_id, nombre, imagen_preview, elementos } = req.body;

    if (!producto_id || !variante_id || !elementos) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    const borrador = await borradoresModel.crearBorrador(
      usuarioId,
      producto_id,
      variante_id,
      nombre,
      imagen_preview,
      elementos
    );
    res.status(201).json(borrador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al guardar borrador' });
  }
});

// PUT /api/client/borradores/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const { nombre, imagen_preview, elementos } = req.body;

    const borrador = await borradoresModel.actualizarBorrador(
      req.params.id,
      usuarioId,
      nombre,
      imagen_preview,
      elementos
    );
    if (!borrador) {
      return res.status(404).json({ message: 'Borrador no encontrado' });
    }
    res.json(borrador);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar borrador' });
  }
});

// DELETE /api/client/borradores/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    await borradoresModel.eliminarBorrador(req.params.id, usuarioId);
    res.json({ message: 'Borrador eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar borrador' });
  }
});

module.exports = router;