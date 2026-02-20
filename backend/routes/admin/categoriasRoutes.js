// routes/admin/categoriasRoutes.js
const express = require("express");
const router = express.Router();
const {
  obtenerCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} = require("../../controllers/admin/categoriasController");

router.get("/", obtenerCategorias);
router.post("/", crearCategoria);
router.put("/:id", actualizarCategoria);
router.delete("/:id", eliminarCategoria);

module.exports = router;