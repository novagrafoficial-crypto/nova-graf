// backend/controllers/admin/reabastecimientoController.js
const model = require('../../models/admin/reabastecimientoModel');

// GET /api/admin/reabastecimiento/productos?categoria_id=&subcategoria_id=&search=
const getProductos = async (req, res) => {
  try {
    const { categoria_id, subcategoria_id, search } = req.query;
    const data = await model.getProductosFiltrados({
      categoria_id:    categoria_id    || null,
      subcategoria_id: subcategoria_id || null,
      search:          search          || '',
    });
    res.json(data);
  } catch (err) {
    console.error('[reabastecimientoController.getProductos]', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/admin/reabastecimiento/productos/:id/variantes
const getVariantes = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await model.getVariantesByProducto(id);
    res.json(data);
  } catch (err) {
    console.error('[reabastecimientoController.getVariantes]', err);
    res.status(500).json({ error: 'Error al obtener variantes' });
  }
};

// GET /api/admin/reabastecimiento/productos/:id/ventas?periodo=dia|semana|mes|todo
const getVentas = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'mes' } = req.query;
    const data = await model.getVentasByProducto(id, periodo);
    res.json(data);
  } catch (err) {
    console.error('[reabastecimientoController.getVentas]', err);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

// GET /api/admin/reabastecimiento/categorias
const getCategorias = async (req, res) => {
  try {
    res.json(await model.getCategorias());
  } catch (err) {
    console.error('[reabastecimientoController.getCategorias]', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// GET /api/admin/reabastecimiento/subcategorias?categoria_id=
const getSubcategorias = async (req, res) => {
  try {
    const { categoria_id } = req.query;
    res.json(await model.getSubcategorias(categoria_id || null));
  } catch (err) {
    console.error('[reabastecimientoController.getSubcategorias]', err);
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
};

// ─── Predicción individual (por producto) ─────────────────────────────────────
const getPrediccion = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = 'mes' } = req.query;
    const data = await model.getPrediccion(id, periodo);
    res.json(data);
  } catch (err) {
    console.error('[reabastecimiento] getPrediccion:', err);
    res.status(500).json({ error: 'Error al calcular predicción.' });
  }
};
 
// ─── Predicción general ───────────────────────────────────────────────────────
// GET /api/admin/reabastecimiento/prediccion
// Devuelve todas las variantes activas con:
//   - stock_actual, ROP, promedio_diario, tasa k, días_hasta_rop, estado
//
// El cálculo exponencial dx/dt = kx se resuelve en el modelo:
//   k = ln(1 − d / x₀)
//   x(t) = x₀ · e^(k·t)
//   t_ROP = ln(ROP / x₀) / k
// ─────────────────────────────────────────────────────────────────────────────
const getPrediccionGeneral = async (_req, res) => {
  try {
    const data = await model.getPrediccionGeneral();
    res.json(data);
  } catch (err) {
    console.error('[reabastecimiento] getPrediccionGeneral:', err);
    res.status(500).json({ error: 'Error al calcular predicción general.' });
  }
};

module.exports = { getProductos, getVariantes, getVentas, getCategorias, getSubcategorias, getPrediccion, getPrediccionGeneral, };