// models/admin/categoriasModel.js
const client = require('../../config/db');

const obtenerCategorias = async () => {
  const result = await client.query("SELECT * FROM categorias ORDER BY id");
  return result.rows;
};

const crearCategoria = async (nombre) => {
  const result = await client.query(
    "INSERT INTO categorias(nombre) VALUES($1) RETURNING *",
    [nombre]
  );
  return result.rows[0];
};

const actualizarCategoria = async (id, nombre) => {
  const result = await client.query(
    "UPDATE categorias SET nombre=$1 WHERE id=$2 RETURNING *",
    [nombre, id]
  );
  return result.rows[0];
};

const eliminarCategoria = async (id) => {
  await client.query("DELETE FROM categorias WHERE id=$1", [id]);
  return { mensaje: "Categoría eliminada" };
};

module.exports = {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
};