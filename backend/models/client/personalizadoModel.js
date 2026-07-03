// backend/models/PersonalizadoModel.js
const pool = require('../config/db');

class PersonalizadoModel {
  // Obtener todos los personalizados con filtros
  static async getAll(filters = {}) {
    const { categoria, limite = 20, offset = 0 } = filters;
    
    let query = `
      SELECT 
        p.id,
        p.titulo,
        p.descripcion,
        p.imagen_url,
        p.cliente_nombre,
        p.categoria,
        p.producto_base_id,
        p.fecha_creacion,
        p.destacado,
        pr.nombre AS producto_base_nombre,
        (SELECT COUNT(*) FROM empresa.personalizados) as total
      FROM empresa.personalizados p
      LEFT JOIN productos.productos pr ON p.producto_base_id = pr.id
      WHERE p.publicado = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Filtro por categoría
    if (categoria && categoria !== 'todas') {
      query += ` AND LOWER(p.categoria) = LOWER($${paramCount})`;
      params.push(categoria);
      paramCount++;
    }
    
    // Ordenar por destacados primero, luego por fecha
    query += ` ORDER BY p.destacado DESC, p.fecha_creacion DESC`;
    
    // Paginación
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limite, offset);
    
    const { rows } = await pool.query(query, params);
    return rows;
  }
  
  // Obtener categorías únicas con conteo
  static async getCategorias() {
    const query = `
      SELECT 
        categoria,
        COUNT(*) as total
      FROM empresa.personalizados
      WHERE publicado = true
      GROUP BY categoria
      ORDER BY total DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
  
  // Obtener un personalizado por ID
  static async getById(id) {
    const query = `
      SELECT 
        p.*,
        pr.nombre AS producto_base_nombre,
        pr.descripcion AS producto_base_descripcion
      FROM empresa.personalizados p
      LEFT JOIN productos.productos pr ON p.producto_base_id = pr.id
      WHERE p.id = $1 AND p.publicado = true
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
  
  // Obtener personalizados destacados (para el home)
  static async getDestacados(limite = 6) {
    const query = `
      SELECT 
        p.id,
        p.titulo,
        p.descripcion,
        p.imagen_url,
        p.cliente_nombre,
        p.categoria,
        p.fecha_creacion,
        pr.nombre AS producto_base_nombre
      FROM empresa.personalizados p
      LEFT JOIN productos.productos pr ON p.producto_base_id = pr.id
      WHERE p.publicado = true AND p.destacado = true
      ORDER BY p.fecha_creacion DESC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limite]);
    return rows;
  }
  
  // Crear un nuevo personalizado (admin)
  static async create(data) {
    const { 
      titulo, descripcion, imagen_url, cliente_nombre, 
      categoria, producto_base_id, destacado = false 
    } = data;
    
    const query = `
      INSERT INTO empresa.personalizados 
      (titulo, descripcion, imagen_url, cliente_nombre, categoria, producto_base_id, destacado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      titulo, descripcion, imagen_url, cliente_nombre, 
      categoria, producto_base_id, destacado
    ]);
    return rows[0];
  }
  
  // Actualizar un personalizado (admin)
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    const allowedFields = ['titulo', 'descripcion', 'imagen_url', 'cliente_nombre', 'categoria', 'producto_base_id', 'destacado', 'publicado'];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const query = `
      UPDATE empresa.personalizados
      SET ${fields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  }
  
  // Eliminar un personalizado (admin)
  static async delete(id) {
    const query = `
      DELETE FROM empresa.personalizados
      WHERE id = $1
      RETURNING id
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
  
  // Obtener productos base para asociar
  static async getProductosBase() {
    const query = `
      SELECT id, nombre, precio_base, imagen_url
      FROM productos.productos
      WHERE activo = true
      ORDER BY nombre
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = PersonalizadoModel;