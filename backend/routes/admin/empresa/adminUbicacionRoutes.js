const express = require("express");
const router = express.Router();

const { obtenerUbicacion, guardarUbicacion } = require("../../../controllers/admin/empresa/ubicacionController");

router.get("/", obtenerUbicacion);
router.post("/", guardarUbicacion);

module.exports = router;