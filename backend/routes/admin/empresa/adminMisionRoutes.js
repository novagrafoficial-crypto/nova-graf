const express = require("express");
const router = express.Router();
const { obtenerMisiones, crearMision, actualizarMision, eliminarMision } =
  require("../../../controllers/admin/empresa/misionController");

router.get("/", obtenerMisiones);
router.post("/", crearMision);
router.put("/:id", actualizarMision);
router.delete("/:id", eliminarMision);

module.exports = router;