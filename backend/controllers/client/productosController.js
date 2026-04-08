// backend/controllers/client/productosController.js
const {
  getProductosCatalogo,
  getProductoDetalle,
  getCategorias,
  getSubcategorias, // ✅ agregado
  getMarcas,        // ✅ agregado
} = require('../../models/client/productosModel');

const productosPersonalizadosModel = require('../../models/client/productosPersonalizadosModel');

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

// GET /api/client/productos/subcategorias ✅
const mostrarSubcategorias = async (req, res) => {
  try {
    const subcategorias = await getSubcategorias();
    res.json(subcategorias);
  } catch (error) {
    console.error('Error al obtener subcategorías:', error);
    res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
};

// GET /api/client/productos/marcas ✅
const mostrarMarcas = async (req, res) => {
  try {
    const marcas = await getMarcas();
    res.json(marcas);
  } catch (error) {
    console.error('Error al obtener marcas:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
};

// POST /api/client/productos/personalizados
const crearProductoPersonalizado = async (req, res) => {
  try {
    const { variante_id, solicitud_diseno_id, texto_personalizado, imagen_personalizada_url, precio_adicional } = req.body;
    if (!variante_id) {
      return res.status(400).json({ message: 'variante_id es obligatorio' });
    }
    const nuevo = await productosPersonalizadosModel.crearProductoPersonalizado(
      variante_id,
      solicitud_diseno_id,
      texto_personalizado,
      imagen_personalizada_url,
      precio_adicional
    );
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear producto personalizado:', error);
    res.status(500).json({ message: 'Error al crear producto personalizado' });
  }
};


module.exports = {
  mostrarCatalogo,
  mostrarDetalle,
  mostrarCategorias,
  mostrarSubcategorias, // ✅ agregado
  mostrarMarcas,        // ✅ agregado
  crearProductoPersonalizado, // ✅ agregado
};