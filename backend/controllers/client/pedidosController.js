// controllers/client/pedidosController.js
const pedidosModel = require('../../models/client/pedidosModel');

const obtenerPedidos = async (req, res) => {
  try {
    // Usa req.usuario.id_usuario como en checkoutController
    const pedidos = await pedidosModel.obtenerPorUsuario(req.usuario.id_usuario);
    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los pedidos' });
  }
};

const cancelarPedido = async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pedidosModel.cancelar(id, req.usuario.id_usuario);
    if (!resultado) {
      return res.status(404).json({ error: 'Pedido no encontrado o no pertenece al usuario' });
    }
    res.json({ mensaje: 'Pedido cancelado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cancelar el pedido' });
  }
};

module.exports = { obtenerPedidos, cancelarPedido };