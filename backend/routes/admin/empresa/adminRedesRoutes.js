const express = require("express");
const router = express.Router();

const { obtenerRedes, crearRed, eliminarRed } = require("../../../controllers/admin/empresa/redesController");

router.get("/", obtenerRedes);
router.post("/", crearRed);
router.delete("/:id", eliminarRed);

module.exports = router;