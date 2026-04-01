const db = require('../../config/db');

const obtenerTodos = async () => {
  const result = await db.query(
    'SELECT * FROM inventario.proveedores ORDER BY proveedor_id DESC'
  );
  return result.rows;
};

const crear = async (proveedor) => {
  const {
    nombre_proveedor,
    contacto_nombre,
    telefono,
    correo_electronico,
    direccion,
    activo
  } = proveedor;

  if (!nombre_proveedor?.trim())
    throw new Error('El nombre del proveedor es requerido');

  const result = await db.query(
    `INSERT INTO inventario.proveedores 
    (nombre_proveedor, contacto_nombre, telefono, correo_electronico, direccion, fecha_registro, activo)
    VALUES ($1, $2, $3, $4, $5, NOW(), $6)
    RETURNING *`,
    [
      nombre_proveedor.trim(),
      contacto_nombre,
      telefono,
      correo_electronico,
      direccion,
      activo ?? true
    ]
  );

  return result.rows[0];
};

const actualizar = async (id, proveedor) => {
  const {
    nombre_proveedor,
    contacto_nombre,
    telefono,
    correo_electronico,
    direccion,
    activo
  } = proveedor;

  if (!nombre_proveedor?.trim())
    throw new Error('El nombre del proveedor es requerido');

  const result = await db.query(
    `UPDATE inventario.proveedores 
     SET nombre_proveedor = $1,
         contacto_nombre = $2,
         telefono = $3,
         correo_electronico = $4,
         direccion = $5,
         activo = $6
     WHERE proveedor_id = $7
     RETURNING *`,
    [
      nombre_proveedor.trim(),
      contacto_nombre,
      telefono,
      correo_electronico,
      direccion,
      activo,
      id
    ]
  );

  if (result.rowCount === 0)
    throw new Error('Proveedor no encontrado');

  return result.rows[0];
};

const eliminar = async (id) => {
  const result = await db.query(
    'DELETE FROM inventario.proveedores WHERE proveedor_id = $1 RETURNING *',
    [id]
  );

  if (result.rowCount === 0)
    throw new Error('Proveedor no encontrado');

  return result.rows[0];
};

module.exports = {
  obtenerTodos,
  crear,
  actualizar,
  eliminar
};