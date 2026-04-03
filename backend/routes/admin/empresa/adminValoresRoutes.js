const express = require("express");
const router = express.Router();

const { obtenerValores, crearValor, actualizarValor, eliminarValor } =
  require("../../../controllers/admin/empresa/valoresController");

router.get("/", obtenerValores);
router.post("/", crearValor);
router.put("/:id", actualizarValor);
router.delete("/:id", eliminarValor);

module.exports = router;