const client = require('../../config/db');


const obtenerSubcategorias = async () => {
  const result = await client.query(`
    SELECT s.id, s.nombre, s.categoria_id, c.nombre AS categoria_nombre
    FROM subcategorias s
    LEFT JOIN categorias c ON s.categoria_id = c.id
    ORDER BY s.id
  `);
  return result.rows;
};

const crearSubcategoria = async (nombre, categoria_id) => {
  const result = await client.query(
    "INSERT INTO subcategorias(nombre, categoria_id) VALUES($1, $2) RETURNING *",
    [nombre, categoria_id]
  );
  return result.rows[0];
};

const actualizarSubcategoria = async (id, nombre, categoria_id) => {
  const result = await client.query(
    "UPDATE subcategorias SET nombre=$1, categoria_id=$2 WHERE id=$3 RETURNING *",
    [nombre, categoria_id, id]
  );
  return result.rows[0];
};

const eliminarSubcategoria = async (id) => {
  await client.query("DELETE FROM subcategorias WHERE id=$1", [id]);
  return { mensaje: "Subcategoría eliminada" };
};

module.exports = {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
};