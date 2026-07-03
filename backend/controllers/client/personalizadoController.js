// backend/controllers/personalizadoController.js
const PersonalizadoModel = require('../models/PersonalizadoModel');

class PersonalizadoController {
  // Obtener todos los personalizados (público)
  static async getPersonalizados(req, res) {
    try {
      const { categoria, limite = 20, offset = 0 } = req.query;
      
      const personalizados = await PersonalizadoModel.getAll({
        categoria,
        limite: parseInt(limite),
        offset: parseInt(offset)
      });
      
      // Obtener categorías con conteos
      const categorias = await PersonalizadoModel.getCategorias();
      
      // Extraer el total de la primera fila (si existe)
      const total = personalizados.length > 0 ? personalizados[0].total : 0;
      
      res.json({
        success: true,
        personalizados,
        categorias,
        total,
        limite: parseInt(limite),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error al obtener personalizados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los trabajos personalizados',
        error: error.message
      });
    }
  }
  
  // Obtener personalizados destacados (para el home)
  static async getDestacados(req, res) {
    try {
      const { limite = 6 } = req.query;
      const personalizados = await PersonalizadoModel.getDestacados(parseInt(limite));
      
      res.json({
        success: true,
        personalizados
      });
    } catch (error) {
      console.error('Error al obtener destacados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los trabajos destacados',
        error: error.message
      });
    }
  }
  
  // Obtener un personalizado por ID
  static async getPersonalizadoById(req, res) {
    try {
      const { id } = req.params;
      const personalizado = await PersonalizadoModel.getById(parseInt(id));
      
      if (!personalizado) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo personalizado no encontrado'
        });
      }
      
      res.json({
        success: true,
        personalizado
      });
    } catch (error) {
      console.error('Error al obtener personalizado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el trabajo personalizado',
        error: error.message
      });
    }
  }
  
  // Obtener productos base para asociar (admin)
  static async getProductosBase(req, res) {
    try {
      const productos = await PersonalizadoModel.getProductosBase();
      res.json({
        success: true,
        productos
      });
    } catch (error) {
      console.error('Error al obtener productos base:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos base',
        error: error.message
      });
    }
  }
  
  // CREAR un nuevo personalizado (admin)
  static async createPersonalizado(req, res) {
    try {
      const { 
        titulo, descripcion, imagen_url, cliente_nombre, 
        categoria, producto_base_id, destacado 
      } = req.body;
      
      // Validar campos requeridos
      if (!titulo || !descripcion || !imagen_url) {
        return res.status(400).json({
          success: false,
          message: 'Título, descripción e imagen son obligatorios'
        });
      }
      
      const personalizado = await PersonalizadoModel.create({
        titulo,
        descripcion,
        imagen_url,
        cliente_nombre,
        categoria,
        producto_base_id,
        destacado: destacado || false
      });
      
      res.status(201).json({
        success: true,
        message: 'Trabajo personalizado creado exitosamente',
        personalizado
      });
    } catch (error) {
      console.error('Error al crear personalizado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el trabajo personalizado',
        error: error.message
      });
    }
  }
  
  // ACTUALIZAR un personalizado (admin)
  static async updatePersonalizado(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const personalizado = await PersonalizadoModel.update(parseInt(id), updateData);
      
      if (!personalizado) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo personalizado no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Trabajo personalizado actualizado exitosamente',
        personalizado
      });
    } catch (error) {
      console.error('Error al actualizar personalizado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el trabajo personalizado',
        error: error.message
      });
    }
  }
  
  // ELIMINAR un personalizado (admin)
  static async deletePersonalizado(req, res) {
    try {
      const { id } = req.params;
      
      const result = await PersonalizadoModel.delete(parseInt(id));
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Trabajo personalizado no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Trabajo personalizado eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar personalizado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el trabajo personalizado',
        error: error.message
      });
    }
  }
}

module.exports = PersonalizadoController;