const express = require("express");
const router = express.Router();

const { obtenerUbicacion, crearUbicacion, actualizarUbicacion, eliminarUbicacion } =
  require("../../../controllers/admin/empresa/ubicacionController");

router.get("/", obtenerUbicacion);
router.post("/", crearUbicacion);
router.put("/:id", actualizarUbicacion);
router.delete("/:id", eliminarUbicacion);

module.exports = router;