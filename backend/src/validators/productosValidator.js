function validarProducto(req, res, next) {

  const { nombre, precio_base } = req.body;

  if (!nombre || nombre.length < 3) {
    return res.status(400).json({
      error: "Nombre inválido"
    });
  }

  if (!precio_base || precio_base <= 0) {
    return res.status(400).json({
      error: "Precio inválido"
    });
  }

  next();
}

module.exports = validarProducto;