const express = require("express");
const router = express.Router();

const { obtenerRedes, crearRed, actualizarRed, eliminarRed } =
  require("../../../controllers/admin/empresa/redesController");

router.get("/", obtenerRedes);
router.post("/", crearRed);
router.put("/:id", actualizarRed);
router.delete("/:id", eliminarRed);

module.exports = router;