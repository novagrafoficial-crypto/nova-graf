const express = require("express");
const router = express.Router();

const {
  obtenerUsuarios,
  cambiarRol,
  cambiarEstado
} = require("../../controllers/admin/usuariosController");

router.get("/", obtenerUsuarios);
router.put("/:id/rol", cambiarRol);
router.put("/:id/activo", cambiarEstado);

module.exports = router;