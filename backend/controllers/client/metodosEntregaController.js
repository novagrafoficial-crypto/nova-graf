// backend/controllers/client/metodosEntregaController.js
const metodosEntregaModel = require('../../models/client/metodosEntregaModel');

const obtenerMetodosEntrega = async (req, res) => {
  try {
    const metodos = await metodosEntregaModel.obtenerMetodosEntrega();
    res.json(metodos);
  } catch (error) {
    console.error('Error al obtener métodos de entrega:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener métodos de entrega' 
    });
  }
};

const obtenerPuntosMedios = async (req, res) => {
  try {
    const puntos = await metodosEntregaModel.obtenerPuntosMedios();
    res.json(puntos);
  } catch (error) {
    console.error('Error al obtener puntos medios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener puntos medios' 
    });
  }
};

const obtenerColonias = async (req, res) => {
  try {
    const colonias = await metodosEntregaModel.obtenerColonias();
    res.json(colonias);
  } catch (error) {
    console.error('Error al obtener colonias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener colonias' 
    });
  }
};

const obtenerTiendasFisicas = async (req, res) => {
  try {
    const tiendas = await metodosEntregaModel.obtenerTiendasFisicas();
    res.json(tiendas);
  } catch (error) {
    console.error('Error al obtener tiendas físicas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener tiendas físicas' 
    });
  }
};

const obtenerMetodoEntregaById = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await metodosEntregaModel.obtenerMetodoEntregaById(id);
    
    if (!metodo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Método de entrega no encontrado' 
      });
    }
    
    res.json(metodo);
  } catch (error) {
    console.error('Error al obtener método de entrega:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener método de entrega' 
    });
  }
};

module.exports = {
  obtenerMetodosEntrega,
  obtenerPuntosMedios,
  obtenerColonias,
  obtenerTiendasFisicas,
  obtenerMetodoEntregaById
};