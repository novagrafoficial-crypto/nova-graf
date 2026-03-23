const detectarAtaque = (req, res, next) => {
  const patrones = /(or|and|--|;|=)/i;

  const revisar = JSON.stringify(req.body) + req.url;

  if (patrones.test(revisar)) {
    console.log("⚠️ Ataque detectado:", revisar);

    return res.status(400).json({
      error: "Posible ataque detectado"
    });
  }

  next();
};

module.exports = detectarAtaque;