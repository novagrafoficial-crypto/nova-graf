const portafolioModel = require('../../models/public/portafolioModel');

const listarPortafolio = async (req, res) => {
  try {
    const portafolio = await portafolioModel.getAllPortafolio();
    res.json({ success: true, portafolio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error al cargar el portafolio' });
  }
};

module.exports = { listarPortafolio };