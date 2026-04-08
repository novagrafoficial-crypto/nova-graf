const PublicacionModel = require('../../models/admin/publicacionModel');

// ── PÚBLICO: Catálogo con variantes ───────────────────────────
exports.getCatalogoPublico = async (req, res) => {
  try {
    const rows = await PublicacionModel.getProductosConVariantes();
    res.json(rows);
  } catch (error) {
    console.error('getCatalogoPublico error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── ADMIN: Listado completo ────────────────────────────────────
exports.getListadoAdmin = async (req, res) => {
  const { tabla } = req.params;
  try {
    if (tabla !== 'productos' && tabla !== 'portafolio') {
      return res.status(400).json({ error: 'Tabla no válida. Use: productos | portafolio' });
    }
    const rows = tabla === 'productos'
      ? await PublicacionModel.getListadoProductosAdmin()
      : await PublicacionModel.getListadoPortafolioAdmin();

    res.json(rows);
  } catch (error) {
    console.error('getListadoAdmin error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── PÚBLICO: Productos publicados simples ──────────────────────
exports.getProductosPublicos = async (req, res) => {
  try {
    const rows = await PublicacionModel.getPublicos('productos');
    res.json(rows);
  } catch (error) {
    console.error('getProductosPublicos error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── PÚBLICO: Portafolio publicado ─────────────────────────────
exports.getPortafolioPublico = async (req, res) => {
  try {
    const rows = await PublicacionModel.getPublicos('portafolio');
    res.json(rows);
  } catch (error) {
    console.error('getPortafolioPublico error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ── ADMIN: Toggle publicado/borrador ──────────────────────────
exports.actualizarEstado = async (req, res) => {
  const { tabla, id } = req.params;
  const { publicado } = req.body;

  if (!['productos', 'portafolio'].includes(tabla)) {
    return res.status(400).json({ error: 'Tabla no válida' });
  }

  try {
    const updated = await PublicacionModel.togglePublicado(tabla, id, publicado);
    if (!updated) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ success: true, item: updated });
  } catch (error) {
    console.error('actualizarEstado error:', error);
    res.status(500).json({ error: error.message });
  }
};