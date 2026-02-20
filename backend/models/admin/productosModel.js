const client = require('../../config/db');

const obtenerProductos = async () => {
  const result = await client.query(`
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock, 
           p.marca_id, m.nombre AS marca_nombre, 
           p.categoria_id, c.nombre AS categoria_nombre, 
           p.subcategoria_id, s.nombre AS subcategoria_nombre,
           p.archivo_imagen, p.activo, p.creado_en, p.actualizado_en
    FROM productos p
    LEFT JOIN marcas m ON p.marca_id = m.id
    LEFT JOIN categorias c ON p.categoria_id = c.id
    LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
    ORDER BY p.id
  `);
  return result.rows;
};

const crearProducto = async (producto) => {
  const { nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, archivo_imagen, activo } = producto;
  const result = await client.query(
    `INSERT INTO productos(nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, archivo_imagen, activo)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, archivo_imagen, activo]
  );
  return result.rows[0];
};

const actualizarProducto = async (id, producto) => {
  const { nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, archivo_imagen, activo } = producto;
  const result = await client.query(
    `UPDATE productos 
     SET nombre=$1, descripcion=$2, precio=$3, stock=$4, marca_id=$5, categoria_id=$6, subcategoria_id=$7, archivo_imagen=$8, activo=$9, actualizado_en=NOW()
     WHERE id=$10 RETURNING *`,
    [nombre, descripcion, precio, stock, marca_id, categoria_id, subcategoria_id, archivo_imagen, activo, id]
  );
  return result.rows[0];
};

const eliminarProducto = async (id) => {
  await client.query("DELETE FROM productos WHERE id=$1", [id]);
  return { mensaje: "Producto eliminado" };
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};