const productosModel = require("../../models/admin/productosModel");
const path = require("path");
const fs = require("fs");

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const productos = await productosModel.obtenerProductos();
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al obtener productos" });
  }
};

// Crear producto
const crearProducto = async (req, res) => {
  const { nombre, descripcion, precio, stock, categoria_id, subcategoria_id, marca_id, caracteristicas } = req.body;
  const archivo_imagen = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Parsear características de texto simple a objeto
    const caracteristicasObj = parsearCaracteristicas(caracteristicas || '');

    const producto = await productosModel.crearProducto({
      nombre, descripcion, precio, stock, categoria_id, subcategoria_id, marca_id,
      caracteristicas: caracteristicasObj,
      archivo_imagen
    });
    res.status(201).json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al crear producto" });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, categoria_id, subcategoria_id, marca_id, caracteristicas } = req.body;
  
  let archivo_imagen = req.body.archivo_imagen_actual;
  if (req.file) {
    if (archivo_imagen) fs.unlinkSync(path.join(__dirname, '../../..', archivo_imagen));
    archivo_imagen = `/uploads/${req.file.filename}`;
  }

  try {
    // Parsear características de texto simple a objeto
    const caracteristicasObj = parsearCaracteristicas(caracteristicas || '');

    const producto = await productosModel.actualizarProducto(id, {
      nombre, descripcion, precio, stock, categoria_id, subcategoria_id, marca_id,
      caracteristicas: caracteristicasObj,
      archivo_imagen
    });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error al actualizar producto" });
  }
};

// Función helper para parsear texto simple a objeto
const parsearCaracteristicas = (texto) => {
  const obj = {};
  texto.split('\n').forEach(linea => {
    const [clave, valor] = linea.split(':').map(str => str.trim());
    if (clave && valor) {
      obj[clave] = valor;
    }
  });
  return obj;
};
// Eliminar producto
const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await productosModel.eliminarProducto(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err.message.includes('no encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || "Error al eliminar producto" });
  }
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};