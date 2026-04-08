const express = require("express");
const router = express.Router();

const {
  generarRespaldo,
  generarRespaldoTabla,
  obtenerHistorialRespaldos,
  obtenerTablas,
  exportarCSV,
  importarCSV,
  upload
} = require("../../controllers/admin/moduloAdminController");

// ─── HISTORIAL Y TABLAS ───────────────────────────────────────────────────────
router.get("/historial", obtenerHistorialRespaldos);
router.get("/tablas", obtenerTablas);

// ─── RESPALDOS .DUMP ──────────────────────────────────────────────────────────
// (*) permite capturar puntos en el parámetro, ej: usuarios.usuarios
router.get("/tabla/:tabla(*)", generarRespaldoTabla);

// ─── CSV ──────────────────────────────────────────────────────────────────────
router.get("/csv/:tabla(*)", exportarCSV);
router.post("/csv/:tabla(*)", upload.single("archivo"), importarCSV);

// ─── RESPALDO COMPLETO (va al final para no interceptar las demás) ────────────
router.get("/", generarRespaldo);

module.exports = router;