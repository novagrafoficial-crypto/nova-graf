const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido_paterno: { type: String },
    apellido_materno: { type: String },
    nombre_usuario: { type: String, required: true, unique: true },
    correo_electronico: { type: String, required: true, unique: true },
    contrasena: { type: String, required: true },

    rol: {
      type: String,
      enum: ["administrador", "cliente"],
      default: "cliente"
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Usuario", usuarioSchema);