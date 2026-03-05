const mongoose = require('mongoose');

// Definir el esquema de Subcategoria
const subcategoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true }
}, { timestamps: true });

// Crear el modelo de Mongoose
const Subcategoria = mongoose.model('Subcategoria', subcategoriaSchema);

// Función para obtener todas las subcategorías con populate para categoria_nombre
const obtenerSubcategorias = async () => {
  return await Subcategoria.find()
    .sort({ _id: 1 })  // Ordenar por ID ascendente (simulando ORDER BY s.id)
    .populate('categoria_id', 'nombre')  // Populate para obtener el nombre de la categoría
    .exec()
    .then(subcategorias => {
      // Mapear para renombrar categoria_id.nombre a categoria_nombre
      return subcategorias.map(sub => ({
        id: sub._id,
        nombre: sub.nombre,
        categoria_id: sub.categoria_id ? sub.categoria_id._id : null,
        categoria_nombre: sub.categoria_id ? sub.categoria_id.nombre : null
      }));
    });
};

// Función para crear una nueva subcategoría
const crearSubcategoria = async (nombre, categoria_id) => {
  if (!nombre?.trim()) {
    throw new Error('El nombre es requerido');
  }
  if (!categoria_id) {
    throw new Error('La categoría es requerida');
  }
  const nuevaSubcategoria = new Subcategoria({ nombre, categoria_id });
  return await nuevaSubcategoria.save();
};

// Función para actualizar una subcategoría
const actualizarSubcategoria = async (id, nombre, categoria_id) => {
  if (!nombre?.trim()) {
    throw new Error('El nombre es requerido');
  }
  if (!categoria_id) {
    throw new Error('La categoría es requerida');
  }
  const subcategoriaActualizada = await Subcategoria.findByIdAndUpdate(
    id,
    { nombre, categoria_id },
    { new: true, runValidators: true }
  );
  if (!subcategoriaActualizada) {
    throw new Error('Subcategoría no encontrada');
  }
  return subcategoriaActualizada;
};

// Función para eliminar una subcategoría
const eliminarSubcategoria = async (id) => {
  const subcategoriaEliminada = await Subcategoria.findByIdAndDelete(id);
  if (!subcategoriaEliminada) {
    throw new Error('Subcategoría no encontrada');
  }
  return { mensaje: 'Subcategoría eliminada' };
};

module.exports = {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria
};