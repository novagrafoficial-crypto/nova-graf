const express = require("express");
const router = express.Router();
const {
  obtenerSubcategorias,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria
} = require("../../controllers/admin/subcategoriasController");

router.get("/", obtenerSubcategorias);
router.post("/", crearSubcategoria);
router.put("/:id", actualizarSubcategoria);
router.delete("/:id", eliminarSubcategoria);

module.exports = router;