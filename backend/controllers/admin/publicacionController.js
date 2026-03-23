// controllers/admin/publicacionController.js
const PublicacionModel = require('../../models/admin/publicacionModel');

// ── ADMIN: Listado completo con todos los campos ──────────────────────────────
exports.getListadoAdmin = async (req, res) => {
  const { tabla } = req.params;
  try {
    if (tabla !== 'productos' && tabla !== 'portafolio') {
      return res.status(400).json({ error: 'Tabla no válida. Use: productos | portafolio' });
    }

    let rows;
    if (tabla === 'productos') {
      rows = await PublicacionModel.getListadoProductosAdmin();
    } else {
      rows = await PublicacionModel.getListadoPortafolioAdmin();
    }

    res.json(rows);
  } catch (error) {
    console.error('getListadoAdmin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── PÚBLICO: Solo los publicados (para el Home) ───────────────────────────────
exports.getProductosPublicos = async (req, res) => {
  try {
    const rows = await PublicacionModel.getPublicos('productos');
    res.json(rows);
  } catch (error) {
    console.error('getProductosPublicos error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── ADMIN: Cambiar estado publicado/borrador ──────────────────────────────────
exports.actualizarEstado = async (req, res) => {
  const { tabla, id } = req.params;
  const { publicado } = req.body;

  try {
    if (tabla !== 'productos' && tabla !== 'portafolio') {
      return res.status(400).json({ error: 'Tabla no válida' });
    }
    if (typeof publicado !== 'boolean') {
      return res.status(400).json({ error: 'El campo publicado debe ser boolean' });
    }

    const updated = await PublicacionModel.togglePublicado(tabla, id, publicado);
    if (!updated) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error('actualizarEstado error:', error);
    res.status(500).json({ error: error.message });
  }
};