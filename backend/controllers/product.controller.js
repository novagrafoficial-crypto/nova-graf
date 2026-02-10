const ProductModel = require("../models/product.model");

const createProduct = (req, res) => {

  const {
    nombre,
    descripcion,
    precio,
    stock,
    categoriaId,
    subcategoriaId
  } = req.body;

  if (!nombre || !precio || !categoriaId) {
    return res.status(400).json({
      message: "Campos obligatorios faltantes"
    });
  }

  const producto = ProductModel.create({
    nombre,
    descripcion,
    precio,
    stock,
    categoriaId,
    subcategoriaId
  });

  res.status(201).json({
    message: "Producto creado",
    producto
  });
};

const getProducts = (req, res) => {
  const productos = ProductModel.getAll();
  res.status(200).json(productos);
};

module.exports = {
  createProduct,
  getProducts
};
