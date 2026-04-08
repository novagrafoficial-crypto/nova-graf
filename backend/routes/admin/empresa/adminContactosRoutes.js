const express = require("express");
const router = express.Router();

const { obtenerContactos, crearContacto, actualizarContacto, eliminarContacto } =
  require("../../../controllers/admin/empresa/contactosController");

router.get("/", obtenerContactos);
router.post("/", crearContacto);
router.put("/:id", actualizarContacto);
router.delete("/:id", eliminarContacto);

module.exports = router;