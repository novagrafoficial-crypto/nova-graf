const CatalogModel = require("../models/catalog.model");

const createCategory = (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({
      message: "Nombre requerido"
    });
  }

  const categoria = CatalogModel.createCategory(nombre);

  res.status(201).json({
    message: "Categoría creada",
    categoria
  });
};

const getCategories = (req, res) => {
  const categorias = CatalogModel.getCategories();
  res.status(200).json(categorias);
};

const createSubcategory = (req, res) => {
  const { idCategoria, nombre } = req.body;

  const sub = CatalogModel.addSubcategory(idCategoria, nombre);

  if (!sub) {
    return res.status(404).json({
      message: "Categoría no encontrada"
    });
  }

  res.status(201).json({
    message: "Subcategoría creada",
    subcategoria: sub
  });
};

module.exports = {
  createCategory,
  getCategories,
  createSubcategory
};
