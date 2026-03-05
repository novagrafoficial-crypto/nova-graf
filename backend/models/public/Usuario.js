const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre:             { type: String, required: true, trim: true },
  apellido_paterno:   { type: String, required: true, trim: true },
  apellido_materno:   { type: String, trim: true },      
  nombre_usuario:     { type: String, trim: true },      
  fecha_nacimiento:   { type: Date },                    
  domicilio:          { type: String, trim: true },     
  telefono:           { type: String, trim: true },      
  correo_electronico: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Correo inválido']
  },
  contrasena:         { type: String },              
  codigo_otp:         { type: Number },                  
  otp_expiracion:     { type: Date },                    
  activo:             { type: Boolean, default: false },
  rol:                { type: String, default: 'cliente' },
  proveedor:          { type: String, default: 'local' },
  google_id:          { type: String },                
}, { 
  timestamps: true,
  minimize: true 
});

module.exports = mongoose.model('Usuario', usuarioSchema);