const express = require("express");
const router = express.Router();

const {
  getResumen,
  getActividad,
  getBloqueos,
  getConsultasLentas,
  getTablas,
  terminarProceso
} = require("../../controllers/admin/monitoreoController");

router.get("/resumen",          getResumen);
router.get("/actividad",        getActividad);
router.get("/bloqueos",         getBloqueos);
router.get("/consultas-lentas", getConsultasLentas);
router.get("/tablas",           getTablas);
router.delete("/proceso/:pid",  terminarProceso);

module.exports = router;