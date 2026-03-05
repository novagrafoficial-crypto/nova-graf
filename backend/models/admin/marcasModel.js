const mongoose = require('mongoose');

// Definir el esquema de Marca
const marcaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true }
}, { timestamps: true });

// Crear el modelo de Mongoose
const Marca = mongoose.model('Marca', marcaSchema);

// Función para obtener todas las marcas
const obtenerTodas = async () => {
  return await Marca.find().sort({ createdAt: -1 });
};

// Función para crear una nueva marca
const crear = async (nombre) => {
  if (!nombre?.trim()) {
    throw new Error('El nombre es requerido');
  }
  const nuevaMarca = new Marca({ nombre });
  return await nuevaMarca.save();
};

// Función para actualizar una marca
const actualizar = async (id, nombre) => {
  if (!nombre?.trim()) {
    throw new Error('El nombre es requerido');
  }
  const marcaActualizada = await Marca.findByIdAndUpdate(
    id,
    { nombre },
    { new: true, runValidators: true }
  );
  if (!marcaActualizada) {
    throw new Error('Marca no encontrada');
  }
  return marcaActualizada;
};

// Función para eliminar una marca
const eliminar = async (id) => {
  const marcaEliminada = await Marca.findByIdAndDelete(id);
  if (!marcaEliminada) {
    throw new Error('Marca no encontrada');
  }
  return marcaEliminada;  // Opcional: retorna el eliminado para confirmación
};

module.exports = {
  obtenerTodas,
  crear,
  actualizar,
  eliminar
};