const express = require("express");
const router = express.Router();

const {
  generarRespaldo,
  generarRespaldoTabla,
  obtenerHistorialRespaldos,
  obtenerTablas,
  exportarCSV,
  importarCSV,
  upload,
} = require("../../controllers/admin/moduloAdminController");

const {
  listarTareas,
  crearTarea,
  eliminarTarea,
  toggleActiva,
  ejecutarAhora,
  listarHistorial,
} = require("../../controllers/admin/schedulerController");

// ─── HISTORIAL Y TABLAS ───────────────────────────────────────────────────────
router.get("/historial", obtenerHistorialRespaldos);
router.get("/tablas", obtenerTablas);

// ─── AUTOMATIZACIÓN (scheduler) ───────────────────────────────────────────────
// IMPORTANTE: estas rutas van antes de /:tabla(*) para que no sean interceptadas
router.get("/scheduler/historial",       listarHistorial);
router.get("/scheduler",                 listarTareas);
router.post("/scheduler",                crearTarea);
router.delete("/scheduler/:id",          eliminarTarea);
router.patch("/scheduler/:id/toggle",    toggleActiva);
router.post("/scheduler/:id/ejecutar",   ejecutarAhora);

// ─── RESPALDOS .DUMP ──────────────────────────────────────────────────────────
// (*) permite capturar puntos en el parámetro, ej: usuarios.usuarios
router.get("/tabla/:tabla(*)", generarRespaldoTabla);

// ─── CSV ──────────────────────────────────────────────────────────────────────
router.get("/csv/:tabla(*)", exportarCSV);
router.post("/csv/:tabla(*)", upload.single("archivo"), importarCSV);

// ─── RESPALDO COMPLETO (va al final para no interceptar las demás) ────────────
router.get("/", generarRespaldo);

module.exports = router;