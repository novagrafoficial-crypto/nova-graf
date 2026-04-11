const HomeModel = require('../../models/client/homeModel');

const homeController = {
  // Devuelve solo el portafolio + estadísticas
  getHomeData: async (req, res) => {
    try {
      const [portafolio, stats] = await Promise.all([
        HomeModel.getPortafolioDestacado(6),   // hasta 6 trabajos
        HomeModel.getStats()
      ]);
      res.json({ portafolio, stats });
    } catch (error) {
      console.error('Error en getHomeData:', error);
      res.status(500).json({ error: 'Error al cargar datos del home' });
    }
  }
};

module.exports = homeController;