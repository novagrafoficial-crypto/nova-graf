// backend/models/client/portafolioModel.js
const pool = require('../../config/db');

/**
 * Obtener todos los productos del portafolio
 */
const obtenerPortafolio = async () => {
    const query = `
        SELECT 
            p.id,
            p.producto_id,
            p.descripcion,
            p.imagen_url,
            p.publicado,
            p.fecha_creacion,
            pr.nombre AS producto_nombre,
            pr.precio_base,
            pr.descripcion AS producto_descripcion,
            c.nombre AS categoria_nombre,
            s.nombre AS subcategoria_nombre
        FROM empresa.portafolio p
        LEFT JOIN productos.productos pr ON p.producto_id = pr.id
        LEFT JOIN productos.categorias c ON pr.categoria_id = c.id
        LEFT JOIN productos.subcategorias s ON pr.subcategoria_id = s.id
        WHERE p.publicado = true
        ORDER BY p.fecha_creacion DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

/**
 * Obtener un producto del portafolio por ID
 */
const obtenerPortafolioPorId = async (id) => {
    const query = `
        SELECT 
            p.id,
            p.producto_id,
            p.descripcion,
            p.imagen_url,
            p.publicado,
            p.fecha_creacion,
            pr.nombre AS producto_nombre,
            pr.precio_base,
            pr.descripcion AS producto_descripcion,
            c.nombre AS categoria_nombre,
            s.nombre AS subcategoria_nombre
        FROM empresa.portafolio p
        LEFT JOIN productos.productos pr ON p.producto_id = pr.id
        LEFT JOIN productos.categorias c ON pr.categoria_id = c.id
        LEFT JOIN productos.subcategorias s ON pr.subcategoria_id = s.id
        WHERE p.id = $1 AND p.publicado = true
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
};

/**
 * Obtener portafolio por producto
 */
const obtenerPortafolioPorProducto = async (productoId) => {
    const query = `
        SELECT 
            p.id,
            p.producto_id,
            p.descripcion,
            p.imagen_url,
            p.publicado,
            p.fecha_creacion
        FROM empresa.portafolio p
        WHERE p.producto_id = $1 AND p.publicado = true
        ORDER BY p.fecha_creacion DESC
    `;
    const { rows } = await pool.query(query, [productoId]);
    return rows;
};

module.exports = {
    obtenerPortafolio,
    obtenerPortafolioPorId,
    obtenerPortafolioPorProducto
};