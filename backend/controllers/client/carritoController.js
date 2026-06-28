// controllers/client/carritoController.js
const carritoModel = require('../../models/client/carritoModel');

// ─── OBTENER CARRITO ──────────────────────────────────────────────
const obtenerCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const items = await carritoModel.obtenerCarrito(usuarioId);
    const total = await carritoModel.obtenerTotalCarrito(usuarioId);
    
    res.json({
      items,
      total,
      cantidad_items: items.length
    });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ message: 'Error al obtener carrito' });
  }
};

// ─── OBTENER CONTE O ───────────────────────────────────────────────
const obtenerConteoCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const count = await carritoModel.obtenerConteoCarrito(usuarioId);
    res.json({ count });
  } catch (error) {
    console.error('Error al obtener conteo:', error);
    res.status(500).json({ message: 'Error al obtener conteo' });
  }
};

// ─── AGREGAR AL CARRITO ────────────────────────────────────────────
const agregarAlCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const { variante_id, cantidad = 1 } = req.body;

    if (!variante_id) {
      return res.status(400).json({ message: 'Se requiere variante_id' });
    }

    if (cantidad < 1) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
    }

    const resultado = await carritoModel.agregarAlCarrito(
      usuarioId,
      variante_id,
      cantidad
    );

    const totalItems = await carritoModel.obtenerConteoCarrito(usuarioId);

    res.status(201).json({
      message: 'Producto agregado al carrito',
      detalle_id: resultado.id,
      cantidad: resultado.cantidad,
      total_items: totalItems
    });

  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ 
      message: error.message || 'Error al agregar al carrito' 
    });
  }
};

// ─── ACTUALIZAR CANTIDAD ───────────────────────────────────────────
const actualizarCantidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const usuarioId = req.usuario.id_usuario;

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
    }

    const resultado = await carritoModel.actualizarCantidad(id, usuarioId, cantidad);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    const totalItems = await carritoModel.obtenerConteoCarrito(usuarioId);

    res.json({
      message: 'Cantidad actualizada',
      detalle_id: resultado.id,
      cantidad: resultado.cantidad,
      total_items: totalItems
    });

  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({ 
      message: error.message || 'Error al actualizar cantidad' 
    });
  }
};

// ─── ELIMINAR DEL CARRITO ──────────────────────────────────────────
const eliminarDelCarrito = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id_usuario;

    const resultado = await carritoModel.eliminarDelCarrito(id, usuarioId);
    
    if (!resultado) {
      return res.status(404).json({ message: 'Item no encontrado' });
    }

    const totalItems = await carritoModel.obtenerConteoCarrito(usuarioId);

    res.json({
      message: 'Item eliminado del carrito',
      detalle_id: resultado.id,
      total_items: totalItems
    });

  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ message: 'Error al eliminar del carrito' });
  }
};

// ─── VACIAR CARRITO ─────────────────────────────────────────────────
const vaciarCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const itemsEliminados = await carritoModel.vaciarCarrito(usuarioId);
    
    res.json({
      message: 'Carrito vaciado',
      items_eliminados: itemsEliminados.length,
      total_items: 0
    });

  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ message: 'Error al vaciar carrito' });
  }
};

// ─── OBTENER TOTAL DEL CARRITO ─────────────────────────────────────
const obtenerTotalCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const total = await carritoModel.obtenerTotalCarrito(usuarioId);
    res.json({ total });
  } catch (error) {
    console.error('Error al obtener total:', error);
    res.status(500).json({ message: 'Error al obtener total' });
  }
};

module.exports = {
  obtenerCarrito,
  obtenerConteoCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito,
  obtenerTotalCarrito
};