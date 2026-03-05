const mongoose = require('mongoose');

// Esquema de Producto (flexible para características variadas)
const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  precio: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  categoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  subcategoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategoria' },
  marca_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca' },
  caracteristicas: { type: Object, default: {} },  // Flexible: { tallas: ['S','M'], color: 'rojo', etc. }
  archivo_imagen: String  // Path/URL de la imagen
}, { timestamps: true });

// Modelo
const Producto = mongoose.model('Producto', productoSchema);

// Obtener todos con populate
const obtenerProductos = async () => {
  return await Producto.find()
    .sort({ _id: 1 })
    .populate('categoria_id', 'nombre')
    .populate('subcategoria_id', 'nombre')
    .populate('marca_id', 'nombre')
    .exec()
    .then(productos => productos.map(prod => ({
      id: prod._id,
      nombre: prod.nombre,
      descripcion: prod.descripcion,
      precio: prod.precio,
      stock: prod.stock,
      categoria_nombre: prod.categoria_id ? prod.categoria_id.nombre : null,
      subcategoria_nombre: prod.subcategoria_id ? prod.subcategoria_id.nombre : null,
      marca_nombre: prod.marca_id ? prod.marca_id.nombre : null,
      caracteristicas: prod.caracteristicas,
      archivo_imagen: prod.archivo_imagen
    })));
};

// Crear
const crearProducto = async (data) => {
  if (!data.nombre?.trim() || !data.precio || !data.categoria_id) {
    throw new Error('Nombre, precio y categoría son requeridos');
  }
  const nuevoProducto = new Producto(data);
  return await nuevoProducto.save();
};

// Actualizar
const actualizarProducto = async (id, data) => {
  if (!data.nombre?.trim() || !data.precio || !data.categoria_id) {
    throw new Error('Nombre, precio y categoría son requeridos');
  }
  const productoActualizado = await Producto.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!productoActualizado) {
    throw new Error('Producto no encontrado');
  }
  return productoActualizado;
};

// Eliminar
const eliminarProducto = async (id) => {
  const productoEliminado = await Producto.findByIdAndDelete(id);
  if (!productoEliminado) {
    throw new Error('Producto no encontrado');
  }
  // Eliminar imagen si existe
  if (productoEliminado.archivo_imagen) {
    require('fs').unlinkSync(require('path').join(__dirname, '../../..', productoEliminado.archivo_imagen));
  }
  return { mensaje: 'Producto eliminado' };
};

module.exports = {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};