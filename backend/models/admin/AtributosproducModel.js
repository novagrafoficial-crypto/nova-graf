const db = require('../../config/db');

// ─── COLORES ────────────────────────────────────────────────────────────────
const obtenerColores = async () => {
  const result = await db.query('SELECT * FROM productos.colores ORDER BY id DESC');
  return result.rows;
};

const crearColor = async (nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'INSERT INTO productos.colores (nombre) VALUES ($1) RETURNING *',
    [nombre.trim()]
  );
  return result.rows[0];
};

const actualizarColor = async (id, nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'UPDATE productos.colores SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre.trim(), id]
  );
  if (result.rowCount === 0) throw new Error('Color no encontrado');
  return result.rows[0];
};

const eliminarColor = async (id) => {
  const result = await db.query(
    'DELETE FROM productos.colores WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Color no encontrado');
  return result.rows[0];
};

// ─── MATERIALES ─────────────────────────────────────────────────────────────
const obtenerMateriales = async () => {
  const result = await db.query('SELECT * FROM productos.materiales ORDER BY id DESC');
  return result.rows;
};

const crearMaterial = async (nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'INSERT INTO productos.materiales (nombre) VALUES ($1) RETURNING *',
    [nombre.trim()]
  );
  return result.rows[0];
};

const actualizarMaterial = async (id, nombre) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'UPDATE productos.materiales SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre.trim(), id]
  );
  if (result.rowCount === 0) throw new Error('Material no encontrado');
  return result.rows[0];
};

const eliminarMaterial = async (id) => {
  const result = await db.query(
    'DELETE FROM productos.materiales WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Material no encontrado');
  return result.rows[0];
};

// ─── TIPOS ATRIBUTO ─────────────────────────────────────────────────────────
const obtenerTiposAtributo = async () => {
  const result = await db.query(
    'SELECT * FROM productos.tipos_atributo ORDER BY id DESC'
  );
  return result.rows;
};

const crearTipoAtributo = async (nombre, activo = true) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'INSERT INTO productos.tipos_atributo (nombre, activo) VALUES ($1, $2) RETURNING *',
    [nombre.trim(), activo]
  );
  return result.rows[0];
};

const actualizarTipoAtributo = async (id, nombre, activo) => {
  if (!nombre?.trim()) throw new Error('El nombre es requerido');
  const result = await db.query(
    'UPDATE productos.tipos_atributo SET nombre = $1, activo = $2 WHERE id = $3 RETURNING *',
    [nombre.trim(), activo, id]
  );
  if (result.rowCount === 0) throw new Error('Tipo de atributo no encontrado');
  return result.rows[0];
};

const eliminarTipoAtributo = async (id) => {
  const result = await db.query(
    'DELETE FROM productos.tipos_atributo WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Tipo de atributo no encontrado');
  return result.rows[0];
};

// ─── VALORES ATRIBUTO ────────────────────────────────────────────────────────
const obtenerValoresAtributo = async () => {
  const result = await db.query(`
    SELECT va.*, ta.nombre AS tipo_nombre
    FROM productos.valores_atributo va
    JOIN productos.tipos_atributo ta ON ta.id = va.tipo_atributo_id
    ORDER BY va.id DESC
  `);
  return result.rows;
};

const crearValorAtributo = async (tipo_atributo_id, valor, activo = true) => {
  if (!tipo_atributo_id) throw new Error('El tipo de atributo es requerido');
  if (!valor?.trim()) throw new Error('El valor es requerido');
  const result = await db.query(
    'INSERT INTO productos.valores_atributo (tipo_atributo_id, valor, activo) VALUES ($1, $2, $3) RETURNING *',
    [tipo_atributo_id, valor.trim(), activo]
  );
  return result.rows[0];
};

const actualizarValorAtributo = async (id, tipo_atributo_id, valor, activo) => {
  if (!tipo_atributo_id) throw new Error('El tipo de atributo es requerido');
  if (!valor?.trim()) throw new Error('El valor es requerido');
  const result = await db.query(
    'UPDATE productos.valores_atributo SET tipo_atributo_id = $1, valor = $2, activo = $3 WHERE id = $4 RETURNING *',
    [tipo_atributo_id, valor.trim(), activo, id]
  );
  if (result.rowCount === 0) throw new Error('Valor de atributo no encontrado');
  return result.rows[0];
};

const eliminarValorAtributo = async (id) => {
  const result = await db.query(
    'DELETE FROM productos.valores_atributo WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) throw new Error('Valor de atributo no encontrado');
  return result.rows[0];
};

module.exports = {
  obtenerColores, crearColor, actualizarColor, eliminarColor,
  obtenerMateriales, crearMaterial, actualizarMaterial, eliminarMaterial,
  obtenerTiposAtributo, crearTipoAtributo, actualizarTipoAtributo, eliminarTipoAtributo,
  obtenerValoresAtributo, crearValorAtributo, actualizarValorAtributo, eliminarValorAtributo,
};