const express = require("express");
const router = express.Router();
const { obtenerVisiones, crearVision, actualizarVision, eliminarVision } =
  require("../../../controllers/admin/empresa/visionController");

router.get("/", obtenerVisiones);
router.post("/", crearVision);
router.put("/:id", actualizarVision);
router.delete("/:id", eliminarVision);

module.exports = router;