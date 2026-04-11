const express = require('express');
const router = express.Router();
const carritoModel = require('../../models/client/carritoModel');
const productosPersonalizadosModel = require('../../models/client/productosPersonalizadosModel');
const verificarToken = require('../../src/middlewares/auth');

// GET /api/client/carrito
router.get('/', verificarToken, async (req, res) => {
  try {
    const items = await carritoModel.obtenerCarrito(req.usuario.id_usuario);
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener carrito' });
  }
});

// GET /api/client/carrito/count
router.get('/count', verificarToken, async (req, res) => {
  try {
    const count = await carritoModel.obtenerConteoCarrito(req.usuario.id_usuario);
    res.json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener conteo' });
  }
});

// POST /api/client/carrito
router.post('/', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const {
      producto_personalizado_id,
      cantidad,
      precio_unitario,
      variante_id,
      texto_personalizado,
      imagen_personalizada_url,
      precio_adicional
    } = req.body;

    // Caso 1: Ya viene el ID del producto personalizado (flujo normal desde personalizador)
    if (producto_personalizado_id) {
      if (!cantidad || !precio_unitario) {
        return res.status(400).json({ message: 'Faltan datos' });
      }

      const itemExistente = await carritoModel.obtenerItemCarritoPorProducto(usuarioId, producto_personalizado_id);
      if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        const itemActualizado = await carritoModel.actualizarCantidad(itemExistente.id, usuarioId, nuevaCantidad);
        return res.json({ message: 'Cantidad actualizada en el carrito', item: itemActualizado });
      }

      const item = await carritoModel.agregarAlCarrito(usuarioId, producto_personalizado_id, cantidad, precio_unitario);
      return res.status(201).json(item);
    }

    // Caso 2: Vienen los datos del diseño (usado desde "Mis diseños")
    if (variante_id && imagen_personalizada_url && precio_unitario) {
      const cantidadRecibida = cantidad || 1;

      // Buscar o crear producto personalizado
      const producto = await productosPersonalizadosModel.buscarOCrearProductoPersonalizado(
        variante_id,
        texto_personalizado || '',
        imagen_personalizada_url,
        precio_adicional || 0
      );

      // Verificar si ya está en el carrito
      const itemExistente = await carritoModel.obtenerItemCarritoPorProducto(usuarioId, producto.id);
      if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidadRecibida;
        const itemActualizado = await carritoModel.actualizarCantidad(itemExistente.id, usuarioId, nuevaCantidad);
        return res.json({ message: 'Cantidad actualizada en el carrito', item: itemActualizado });
      }

      // Agregar nuevo ítem
      const item = await carritoModel.agregarAlCarrito(usuarioId, producto.id, cantidadRecibida, precio_unitario);
      return res.status(201).json(item);
    }

    return res.status(400).json({ message: 'Faltan datos obligatorios' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar al carrito' });
  }
});

// PUT /api/client/carrito/:id
router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { cantidad } = req.body;
    if (!cantidad || cantidad < 1) return res.status(400).json({ message: 'Cantidad inválida' });
    const item = await carritoModel.actualizarCantidad(req.params.id, req.usuario.id_usuario, cantidad);
    if (!item) return res.status(404).json({ message: 'Item no encontrado' });
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar' });
  }
});

// DELETE /api/client/carrito/:id
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await carritoModel.eliminarDelCarrito(req.params.id, req.usuario.id_usuario);
    res.json({ message: 'Item eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar' });
  }
});

module.exports = router;