// backend/models/client/metodosPagoModel.js
const pool = require('../../config/db');

/**
 * Obtener todos los métodos de pago activos
 * @returns {Promise<Array>} Lista de métodos de pago
 */
const obtenerMetodosPago = async () => {
  const query = `
    SELECT 
      id,
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      activo,
      orden,
      created_at,
      updated_at
    FROM ventas.metodos_pago
    WHERE activo = true
    ORDER BY orden ASC, id ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtener un método de pago por ID
 * @param {number} id - ID del método de pago
 * @returns {Promise<Object|null>} Método de pago o null
 */
const obtenerMetodoPagoById = async (id) => {
  const query = `
    SELECT 
      id,
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      activo,
      orden
    FROM ventas.metodos_pago
    WHERE id = $1 AND activo = true
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Crear un nuevo método de pago (Admin)
 * @param {Object} data - Datos del método de pago
 * @returns {Promise<Object>} Método de pago creado
 */
const crearMetodoPago = async (data) => {
  const { 
    nombre, 
    tipo, 
    descripcion, 
    instrucciones, 
    datos_bancarios, 
    requiere_comprobante = true, 
    orden = 0 
  } = data;

  const query = `
    INSERT INTO ventas.metodos_pago (
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      orden,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    RETURNING *
  `;
  const values = [
    nombre,
    tipo,
    descripcion || null,
    instrucciones || null,
    datos_bancarios || null,
    requiere_comprobante,
    orden
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Actualizar un método de pago (Admin)
 * @param {number} id - ID del método de pago
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object|null>} Método de pago actualizado
 */
const actualizarMetodoPago = async (id, data) => {
  const { 
    nombre, 
    tipo, 
    descripcion, 
    instrucciones, 
    datos_bancarios, 
    requiere_comprobante, 
    activo,
    orden 
  } = data;

  const query = `
    UPDATE ventas.metodos_pago 
    SET 
      nombre = COALESCE($1, nombre),
      tipo = COALESCE($2, tipo),
      descripcion = COALESCE($3, descripcion),
      instrucciones = COALESCE($4, instrucciones),
      datos_bancarios = COALESCE($5, datos_bancarios),
      requiere_comprobante = COALESCE($6, requiere_comprobante),
      activo = COALESCE($7, activo),
      orden = COALESCE($8, orden),
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
  `;
  const values = [
    nombre || null,
    tipo || null,
    descripcion || null,
    instrucciones || null,
    datos_bancarios || null,
    requiere_comprobante,
    activo,
    orden,
    id
  ];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

/**
 * Eliminar un método de pago (Admin) - Soft delete
 * @param {number} id - ID del método de pago
 * @returns {Promise<boolean>} True si se eliminó
 */
const eliminarMetodoPago = async (id) => {
  const query = `
    UPDATE ventas.metodos_pago 
    SET activo = false, updated_at = NOW()
    WHERE id = $1
  `;
  await pool.query(query, [id]);
  return true;
};

/**
 * Obtener métodos de pago para administración (incluye inactivos)
 * @returns {Promise<Array>} Lista de todos los métodos de pago
 */
const obtenerTodosMetodosPago = async () => {
  const query = `
    SELECT 
      id,
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      activo,
      orden,
      created_at,
      updated_at
    FROM ventas.metodos_pago
    ORDER BY orden ASC, id ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtener método de pago por tipo
 * @param {string} tipo - Tipo de método de pago (TRANSFERENCIA, DEPOSITO, EFECTIVO)
 * @returns {Promise<Object|null>} Método de pago o null
 */
const obtenerMetodoPagoByTipo = async (tipo) => {
  const query = `
    SELECT 
      id,
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      activo,
      orden
    FROM ventas.metodos_pago
    WHERE tipo = $1 AND activo = true
    ORDER BY orden ASC
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [tipo]);
  return rows[0] || null;
};

module.exports = {
  obtenerMetodosPago,
  obtenerMetodoPagoById,
  crearMetodoPago,
  actualizarMetodoPago,
  eliminarMetodoPago,
  obtenerTodosMetodosPago,
  obtenerMetodoPagoByTipo
};