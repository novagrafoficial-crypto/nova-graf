const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Carpeta para imágenes

const {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require("../../controllers/admin/productosController");

// Rutas CRUD de productos
router.get("/", obtenerProductos);
router.post("/", upload.single("archivo_imagen"), crearProducto);
router.put("/:id", upload.single("archivo_imagen"), actualizarProducto);
router.delete("/:id", eliminarProducto);

module.exports = router;