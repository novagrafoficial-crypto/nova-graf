const productosModel = require('../../models/admin/productosModel');

// ─── HELPER: parsear body sea FormData o JSON puro ────────
// El frontend actual manda FormData con campos JSON string.
// Si en el futuro manda JSON puro, también funciona.
const parsearBody = (body) => {
  // Si viene como JSON puro (Content-Type: application/json)
  if (body.producto && typeof body.producto === 'object') {
    return {
      producto:      body.producto,
      tiposAtributo: body.tiposAtributo || [],
      variantes:     body.variantes     || [],
    };
  }

  // Si viene como FormData (campos son strings JSON)
  const producto      = typeof body.producto      === 'string' ? JSON.parse(body.producto      || '{}') : (body.producto      || {});
  const tiposAtributo = typeof body.tiposAtributo === 'string' ? JSON.parse(body.tiposAtributo || '[]') : (body.tiposAtributo || []);
  const variantes     = typeof body.variantes     === 'string' ? JSON.parse(body.variantes     || '[]') : (body.variantes     || []);

  return { producto, tiposAtributo, variantes };
};

// ─── CATÁLOGOS ────────────────────────────────────────────

const obtenerCatalogos = async (req, res) => {
  try {
    const [colores, materiales, tiposAtributo] = await Promise.all([
      productosModel.obtenerColores(),
      productosModel.obtenerMateriales(),
      productosModel.obtenerTiposAtributo(),
    ]);
    res.json({ colores, materiales, tiposAtributo });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener catálogos' });
  }
};

// ─── LISTAR ───────────────────────────────────────────────

const obtenerProductos = async (req, res) => {
  try {
    const productos = await productosModel.obtenerProductos();
    res.json(productos);
  } catch (err) {
    console.error('[obtenerProductos]', err);
    res.status(500).json({ error: err.message });
  }
};

const obtenerProductoDetalle = async (req, res) => {
  try {
    const producto = await productosModel.obtenerProductoDetalle(req.params.id);
    res.json(producto);
  } catch (err) {
    console.error('[obtenerProductoDetalle ERROR]', err.message); // agrega esto
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ─── CREAR COMPLETO ───────────────────────────────────────

const crearProducto = async (req, res) => {
  let producto, tiposAtributo, variantes;

  try {
    ({ producto, tiposAtributo, variantes } = parsearBody(req.body));
  } catch {
    return res.status(400).json({ error: 'El formato del cuerpo es inválido (JSON malformado)' });
  }

  if (!producto.nombre?.trim())
    return res.status(400).json({ error: 'El nombre es requerido' });
  if (!producto.precio_base)
    return res.status(400).json({ error: 'El precio es requerido' });
  if (!producto.categoria_id)
    return res.status(400).json({ error: 'La categoría es requerida' });

  try {
    const result = await productosModel.crearProductoCompleto({
      producto,
      tiposAtributo,
      variantes,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error('[crearProducto]', err);
    if (err.code === '23505')
      return res.status(400).json({ error: 'El SKU ya existe' });
    res.status(500).json({ error: err.message || 'Error al crear producto' });
  }
};

// ─── ACTUALIZAR PRODUCTO BASE ─────────────────────────────

const actualizarProducto = async (req, res) => {
  try {
    const producto = await productosModel.actualizarProducto(
      req.params.id,
      req.body
    );
    res.json(producto);
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    if (err.message.includes('requerido'))
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ─── ELIMINAR PRODUCTO ────────────────────────────────────

const eliminarProducto = async (req, res) => {
  try {
    const result = await productosModel.eliminarProducto(req.params.id);
    res.json({ mensaje: result.mensaje });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ─── VARIANTES ────────────────────────────────────────────

const agregarVariante = async (req, res) => {
  try {
    const result = await productosModel.agregarVariante(req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El SKU ya existe' });
    if (err.message.includes('requerido'))
      return res.status(400).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

const actualizarVariante = async (req, res) => {
  try {
    const result = await productosModel.actualizarVariante(
      req.params.varianteId,
      req.body
    );
    res.json(result);
  } catch (err) {
    if (err.message.includes('no encontrada'))
      return res.status(404).json({ error: err.message });
    if (err.message.includes('requerido'))
      return res.status(400).json({ error: err.message });
    if (err.code === '23505')
      return res.status(400).json({ error: 'El SKU ya existe' });
    res.status(500).json({ error: err.message });
  }
};

const eliminarVariante = async (req, res) => {
  try {
    const result = await productosModel.eliminarVariante(req.params.varianteId);
    res.json({ mensaje: result.mensaje });
  } catch (err) {
    console.error('[eliminarVariante ERROR]', err.message); // agrega esto
    if (err.message.includes('no encontrada'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

const actualizarStock = async (req, res) => {
  try {
    const result = await productosModel.actualizarStock(
      req.params.varianteId,
      req.body.cantidad
    );
    res.json(result);
  } catch (err) {
    if (err.message.includes('requerida') || err.message.includes('número'))
      return res.status(400).json({ error: err.message });
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  obtenerCatalogos,
  obtenerProductos,
  obtenerProductoDetalle,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  agregarVariante,
  actualizarVariante,
  eliminarVariante,
  actualizarStock,
};