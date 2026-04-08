const express = require("express");
const router = express.Router();

const { obtenerAntecedentes, crearAntecedente, actualizarAntecedente, eliminarAntecedente } =
  require("../../../controllers/admin/empresa/antecedentesController");

router.get("/", obtenerAntecedentes);
router.post("/", crearAntecedente);
router.put("/:id", actualizarAntecedente);
router.delete("/:id", eliminarAntecedente);

module.exports = router;