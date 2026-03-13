const productosModel = require('../../models/admin/productosModel');
const path = require('node:path');
const fs   = require('node:fs');

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
    console.error('Error al obtener catálogos:', err.message); // ✅ usa err
    res.status(500).json({ error: 'Error al obtener catálogos' });
  }
};


// ─── LISTAR ───────────────────────────────────────────────
const obtenerProductos = async (req, res) => {
  try {
    const productos = await productosModel.obtenerProductos();
    res.json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err.message); // ✅ usa err
    res.status(500).json({ error: err.message });
  }
};

const obtenerProductoDetalle = async (req, res) => {
  try {
    const producto = await productosModel.obtenerProductoDetalle(req.params.id);
    res.json(producto);
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ─── CREAR COMPLETO ───────────────────────────────────────
const crearProducto = async (req, res) => {
  try {
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

    // El body viene como JSON string en FormData
    const producto     = JSON.parse(req.body.producto     || '{}');
    const tiposAtributo = JSON.parse(req.body.tiposAtributo || '[]');
    const variantes    = JSON.parse(req.body.variantes    || '[]');

    if (!producto.nombre?.trim())  return res.status(400).json({ error: 'El nombre es requerido' });
    if (!producto.precio_base)     return res.status(400).json({ error: 'El precio es requerido' });
    if (!producto.categoria_id)    return res.status(400).json({ error: 'La categoría es requerida' });

    const result = await productosModel.crearProductoCompleto({ producto, tiposAtributo, variantes, imagen_url });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(400).json({ error: 'El SKU ya existe' });
    res.status(500).json({ error: err.message || 'Error al crear producto' });
  }
};

// ─── ACTUALIZAR BASE ──────────────────────────────────────
const actualizarProducto = async (req, res) => {
  const { id } = req.params;

  let imagen_url = req.body.imagen_actual || null;
  if (req.file) {
    if (imagen_url) {
      const ruta = path.join(__dirname, '../../..', imagen_url);
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }
    imagen_url = `/uploads/${req.file.filename}`;
  }

  try {
    const producto = await productosModel.actualizarProducto(id, { ...req.body, imagen_url });
    res.json(producto);
  } catch (err) {
    if (err.message.includes('no encontrado')) return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500).json({ error: err.message });
  }
};

// ─── ELIMINAR ─────────────────────────────────────────────
const eliminarProducto = async (req, res) => {
  try {
    const result = await productosModel.eliminarProducto(req.params.id);
    if (result.imagen_url) {
      const ruta = path.join(__dirname, '../../..', result.imagen_url);
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }
    res.json({ mensaje: result.mensaje });
  } catch (err) {
    if (err.message.includes('no encontrado')) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ─── VARIANTES ────────────────────────────────────────────
const agregarVariante = async (req, res) => {
  try {
    const result = await productosModel.agregarVariante(req.params.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El SKU ya existe' });
    res.status(500).json({ error: err.message });
  }
};

const eliminarVariante = async (req, res) => {
  try {
    const result = await productosModel.eliminarVariante(req.params.varianteId);
    res.json(result);
  } catch (err) {
    if (err.message.includes('no encontrada')) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

const actualizarStock = async (req, res) => {
  try {
    const result = await productosModel.actualizarStock(req.params.varianteId, req.body.cantidad);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  obtenerCatalogos, obtenerProductos, obtenerProductoDetalle,
  crearProducto, actualizarProducto, eliminarProducto,
  agregarVariante, eliminarVariante, actualizarStock
};