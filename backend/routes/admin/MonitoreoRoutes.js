const express = require("express");
const router  = express.Router();

const {
  // Existentes
  getResumen,
  getActividad,
  getBloqueos,
  getConsultasLentas,
  getTablas,
  getTablasUsadas,
  getConsultasPorTipo,
  getUsuariosActivos,
  getUltimasConsultas,
  terminarProceso,
  // Nuevas
  getIndicesFaltantes,
  getSaludGeneral,
  getEspacioPorEsquema,
  ejecutarQuery,
  explicarQuery
} = require("../../controllers/admin/monitoreoController");

// ─── Endpoints existentes ─────────────────────────────────────────────────────
router.get("/resumen",            getResumen);
router.get("/actividad",          getActividad);
router.get("/bloqueos",           getBloqueos);
router.get("/consultas-lentas",   getConsultasLentas);
router.get("/tablas",             getTablas);
router.delete("/proceso/:pid",    terminarProceso);

// ─── Analítica ────────────────────────────────────────────────────────────────
router.get("/tablas-usadas",      getTablasUsadas);
router.get("/consultas-por-tipo", getConsultasPorTipo);
router.get("/usuarios-activos",   getUsuariosActivos);
router.get("/ultimas-consultas",  getUltimasConsultas);

// ─── Nuevos endpoints ─────────────────────────────────────────────────────────
router.get("/salud",              getSaludGeneral);      // Score 0-100 + alertas accionables
router.get("/indices",            getIndicesFaltantes);  // Índices faltantes, inutilizados y duplicados
router.get("/espacio",            getEspacioPorEsquema); // Tamaño por esquema y tabla

// Ejecutor interactivo — reciben { sql } en el body
router.post("/query/ejecutar",    ejecutarQuery);        // Corre SELECT y devuelve resultados
router.post("/query/explain",     explicarQuery);        // Corre EXPLAIN ANALYZE y devuelve el plan

module.exports = router;