// backend/controllers/client/productosController.js
const {
  getProductosCatalogo,
  getProductoDetalle,
  getCategorias,
} = require('../../models/client/productosModel');

// GET /api/client/productos/catalogo
const mostrarCatalogo = async (req, res) => {
  try {
    const productos = await getProductosCatalogo();
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener catálogo:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/client/productos/:id
const mostrarDetalle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    const variantes = await getProductoDetalle(id);

    if (!variantes.length) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const {
      producto_id, producto_nombre, descripcion, precio_base,
      categoria, subcategoria, marca, material,
    } = variantes[0];

    const detalle = {
      producto_id,
      producto_nombre,
      descripcion,
      precio_base,
      categoria,
      subcategoria,
      marca,
      material,
      variantes: variantes.map(v => ({
        variante_id:      v.variante_id,
        precio_adicional: v.precio_adicional,
        imagen_url:       v.imagen_url,
        color:            v.color,
        atributos:        v.atributos || [],
      })),
    };

    res.json(detalle);
  } catch (error) {
    console.error('Error al obtener detalle de producto:', error);
    res.status(500).json({ error: 'Error al obtener detalle del producto' });
  }
};

// GET /api/client/productos/categorias
const mostrarCategorias = async (req, res) => {
  try {
    const categorias = await getCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

module.exports = {
  mostrarCatalogo,
  mostrarDetalle,
  mostrarCategorias,
};