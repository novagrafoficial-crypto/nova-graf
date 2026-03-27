const express = require("express");
const router  = express.Router();

const {
  getResumen,
  getActividad,
  getBloqueos,
  getConsultasLentas,
  getTablas,
  getTablasUsadas,
  getConsultasPorTipo,
  getUsuariosActivos,
  getUltimasConsultas,
  terminarProceso
} = require("../../controllers/admin/monitoreoController");

// ─── Endpoints existentes ─────────────────────────────────────────────────────
router.get("/resumen",           getResumen);
router.get("/actividad",         getActividad);
router.get("/bloqueos",          getBloqueos);
router.get("/consultas-lentas",  getConsultasLentas);
router.get("/tablas",            getTablas);          // solo esquema "empresa"
router.delete("/proceso/:pid",   terminarProceso);

// ─── Nuevos endpoints de analítica ───────────────────────────────────────────
router.get("/tablas-usadas",      getTablasUsadas);
router.get("/consultas-por-tipo", getConsultasPorTipo);
router.get("/usuarios-activos",   getUsuariosActivos);
router.get("/ultimas-consultas",  getUltimasConsultas);

module.exports = router;