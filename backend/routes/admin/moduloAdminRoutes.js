const express = require("express");
const router = express.Router();

const {
  generarRespaldo,
  generarRespaldoTabla,
  obtenerHistorialRespaldos,
  obtenerTablas
} = require("../../controllers/admin/moduloAdminController");

router.get("/historial", obtenerHistorialRespaldos);

router.get("/tablas", obtenerTablas);

// ✅ FIX: (*) permite capturar puntos en el parámetro, ej: usuarios.usuarios
router.get("/tabla/:tabla(*)", generarRespaldoTabla);

// La ruta raíz va al final para no interceptar las demás
router.get("/", generarRespaldo);

module.exports = router;