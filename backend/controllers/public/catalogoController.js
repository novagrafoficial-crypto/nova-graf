// controllers/public/catalogoController.js
const modelo = require('../../models/public/catalogoModel');

// GET /api/catalogo/categorias
const getCategorias = async (req, res) => {
  try { res.json(await modelo.obtenerCategorias()); }
  catch (e) { console.error('[getCategorias]', e.message); res.status(500).json({ error: e.message }); }
};

// GET /api/catalogo/filtros?categoria_id=1&subcategoria_id=2
const getFiltros = async (req, res) => {
  try {
    const { categoria_id, subcategoria_id } = req.query;
    res.json(await modelo.obtenerFiltros(
      categoria_id    ? parseInt(categoria_id)    : null,
      subcategoria_id ? parseInt(subcategoria_id) : null
    ));
  }
  catch (e) { console.error('[getFiltros]', e.message); res.status(500).json({ error: e.message }); }
};

// GET /api/catalogo/productos
const getProductos = async (req, res) => {
  try {
    const {
      busqueda, categoria_id, subcategoria_id,
      marca_id, material_id, precio_min, precio_max,
      orden, pagina, por_pagina,
    } = req.query;

    // color_ids: "1,2,3" → [1,2,3]
    const color_ids = req.query.color_ids
      ? req.query.color_ids.split(',').map(Number).filter(Boolean)
      : [];

    // atributos: '{"1":[2,3],"4":[5]}' → { 1:[2,3], 4:[5] }
    let atributos = {};
    if (req.query.atributos) {
      try { atributos = JSON.parse(req.query.atributos); } catch {}
    }

    const resultado = await modelo.listarProductos({
      busqueda,
      categoria_id:    categoria_id    ? parseInt(categoria_id)    : null,
      subcategoria_id: subcategoria_id ? parseInt(subcategoria_id) : null,
      marca_id:        marca_id        ? parseInt(marca_id)        : null,
      material_id:     material_id     ? parseInt(material_id)     : null,
      color_ids,
      precio_min: precio_min !== undefined && precio_min !== '' ? parseFloat(precio_min) : null,
      precio_max: precio_max !== undefined && precio_max !== '' ? parseFloat(precio_max) : null,
      atributos,
      orden,
      pagina,
      por_pagina,
    });

    res.json(resultado);
  }
  catch (e) {
    console.error('[getProductos] ERROR:', e.message);
    console.error('[getProductos] DETAIL:', e.detail || '');
    res.status(500).json({ error: e.message });
  }
};

// GET /api/catalogo/productos/:id
const getDetalle = async (req, res) => {
  try {
    const p = await modelo.obtenerDetalle(parseInt(req.params.id));
    if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(p);
  }
  catch (e) { console.error('[getDetalle]', e.message); res.status(500).json({ error: e.message }); }
};

module.exports = { getCategorias, getFiltros, getProductos, getDetalle };