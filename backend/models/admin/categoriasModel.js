const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema(
{
nombre: {
type: String,
required: true,
trim: true,
unique: true
}
},
{
timestamps: true // agrega createdAt y updatedAt automáticamente
}
);

// Mongo creará la colección "categorias" automáticamente
module.exports = mongoose.model("Categoria", categoriaSchema);
