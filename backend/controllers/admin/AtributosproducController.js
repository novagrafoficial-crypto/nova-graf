const m = require('../../models/admin/AtributosproducModel');

// ─── COLORES ────────────────────────────────────────────────────────────────
const obtenerColores = async (req, res) => {
  try {
    const data = await m.obtenerColores();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener colores' });
  }
};

const crearColor = async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevo = await m.crearColor(nombre);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El color ya existe' });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al crear color' });
  }
};

const actualizarColor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const actualizado = await m.actualizarColor(id, nombre);
    res.json(actualizado);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El color ya existe' });
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al actualizar color' });
  }
};

const eliminarColor = async (req, res) => {
  try {
    const { id } = req.params;
    await m.eliminarColor(id);
    res.json({ mensaje: 'Color eliminado' });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Error al eliminar color' });
  }
};

// ─── MATERIALES ─────────────────────────────────────────────────────────────
const obtenerMateriales = async (req, res) => {
  try {
    const data = await m.obtenerMateriales();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener materiales' });
  }
};

const crearMaterial = async (req, res) => {
  try {
    const { nombre } = req.body;
    const nuevo = await m.crearMaterial(nombre);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El material ya existe' });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al crear material' });
  }
};

const actualizarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    const actualizado = await m.actualizarMaterial(id, nombre);
    res.json(actualizado);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El material ya existe' });
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al actualizar material' });
  }
};

const eliminarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    await m.eliminarMaterial(id);
    res.json({ mensaje: 'Material eliminado' });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Error al eliminar material' });
  }
};

// ─── TIPOS ATRIBUTO ─────────────────────────────────────────────────────────
const obtenerTiposAtributo = async (req, res) => {
  try {
    const data = await m.obtenerTiposAtributo();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tipos de atributo' });
  }
};

const crearTipoAtributo = async (req, res) => {
  try {
    const { nombre, activo } = req.body;
    const nuevo = await m.crearTipoAtributo(nombre, activo);
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El tipo de atributo ya existe' });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al crear tipo de atributo' });
  }
};

const actualizarTipoAtributo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;
    const actualizado = await m.actualizarTipoAtributo(id, nombre, activo);
    res.json(actualizado);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El tipo de atributo ya existe' });
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al actualizar tipo de atributo' });
  }
};

const eliminarTipoAtributo = async (req, res) => {
  try {
    const { id } = req.params;
    await m.eliminarTipoAtributo(id);
    res.json({ mensaje: 'Tipo de atributo eliminado' });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Error al eliminar tipo de atributo' });
  }
};

// ─── VALORES ATRIBUTO ────────────────────────────────────────────────────────
const obtenerValoresAtributo = async (req, res) => {
  try {
    const data = await m.obtenerValoresAtributo();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener valores de atributo' });
  }
};

const crearValorAtributo = async (req, res) => {
  try {
    const { tipo_atributo_id, valor, activo } = req.body;
    const nuevo = await m.crearValorAtributo(tipo_atributo_id, valor, activo);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al crear valor de atributo' });
  }
};

const actualizarValorAtributo = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_atributo_id, valor, activo } = req.body;
    const actualizado = await m.actualizarValorAtributo(id, tipo_atributo_id, valor, activo);
    res.json(actualizado);
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(err.message.includes('requerido') ? 400 : 500)
      .json({ error: err.message || 'Error al actualizar valor de atributo' });
  }
};

const eliminarValorAtributo = async (req, res) => {
  try {
    const { id } = req.params;
    await m.eliminarValorAtributo(id);
    res.json({ mensaje: 'Valor de atributo eliminado' });
  } catch (err) {
    if (err.message.includes('no encontrado'))
      return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Error al eliminar valor de atributo' });
  }
};

module.exports = {
  obtenerColores, crearColor, actualizarColor, eliminarColor,
  obtenerMateriales, crearMaterial, actualizarMaterial, eliminarMaterial,
  obtenerTiposAtributo, crearTipoAtributo, actualizarTipoAtributo, eliminarTipoAtributo,
  obtenerValoresAtributo, crearValorAtributo, actualizarValorAtributo, eliminarValorAtributo,
};