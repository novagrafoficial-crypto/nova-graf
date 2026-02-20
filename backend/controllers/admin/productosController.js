const productosModel = require("../../models/admin/productosModel");

// Listar todos los productos
const obtenerProductos = async (_req, res) => {
  try {
    const productos = await productosModel.obtenerProductos();
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

// Crear producto
const crearProducto = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const productoData = {
      nombre: req.body.nombre || "",
      descripcion: req.body.descripcion || "",
      precio: parseFloat(req.body.precio) || 0,
      stock: parseInt(req.body.stock) || 0,
      marca_id: parseInt(req.body.marca_id) || null,
      categoria_id: parseInt(req.body.categoria_id) || null,
      subcategoria_id: parseInt(req.body.subcategoria_id) || null,
      activo: req.body.activo === "true" || req.body.activo === true,
      archivo_imagen: req.file ? req.file.filename : null
    };

    const producto = await productosModel.crearProducto(productoData);
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

// Actualizar producto
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const productoData = {
      nombre: req.body.nombre || "",
      descripcion: req.body.descripcion || "",
      precio: parseFloat(req.body.precio) || 0,
      stock: parseInt(req.body.stock) || 0,
      marca_id: parseInt(req.body.marca_id) || null,
      categoria_id: parseInt(req.body.categoria_id) || null,
      subcategoria_id: parseInt(req.body.subcategoria_id) || null,
      activo: req.body.activo === "true" || req.body.activo === true,
      archivo_imagen: req.file ? req.file.filename : req.body.archivo_imagen || null
    };

    const producto = await productosModel.actualizarProducto(id, productoData);
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

// Eliminar producto
const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await productosModel.eliminarProducto(id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};