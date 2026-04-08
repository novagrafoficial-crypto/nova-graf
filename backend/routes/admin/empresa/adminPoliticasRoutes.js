const express = require("express");
const router = express.Router();

const { obtenerPoliticas, crearPolitica, actualizarPolitica, eliminarPolitica } =
  require("../../../controllers/admin/empresa/politicasController");

router.get("/", obtenerPoliticas);
router.post("/", crearPolitica);
router.put("/:id", actualizarPolitica);
router.delete("/:id", eliminarPolitica);

module.exports = router;