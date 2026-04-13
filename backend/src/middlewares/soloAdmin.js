module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "No autenticado"
    });
  }

  if (req.user.rol !== 'admin' && req.user.rol !== 'administrador') {
    return res.status(403).json({
      error: "Acceso solo para administradores"
    });
  }

  next();
};