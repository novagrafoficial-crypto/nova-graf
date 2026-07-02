const pedidosModel = require('../../models/admin/pedidosModel');

const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await pedidosModel.obtenerTodos();
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const obtenerPedidoPorId = async (req, res) => {
  try {
    const data = await pedidosModel.obtenerPorId(req.params.id);
    if (!data.pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await pedidosModel.actualizarEstado(req.params.id, estado);
    res.json(pedido);
  } catch (err) {
    res.status(err.message.includes('no encontrado') ? 404 : 500).json({ error: err.message });
  }
};

const actualizarPago = async (req, res) => {
  try {
    const { estado_pago, notas_admin } = req.body;
    const pago = await pedidosModel.actualizarPago(req.params.id, estado_pago, notas_admin);
    res.json(pago);
  } catch (err) {
    res.status(err.message.includes('no encontrado') ? 404 : 500).json({ error: err.message });
  }
};

const subirPrevia = async (req, res) => {
  try {
    const { pedido_cliente_id, numero_previa, imagen_url } = req.body;
    const previa = await pedidosModel.subirPrevia(pedido_cliente_id, numero_previa, imagen_url);
    res.status(201).json(previa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const enviarMensaje = async (req, res) => {
  try {
    const { pedido_cliente_id, remitente_id, mensaje } = req.body;
    const msg = await pedidosModel.enviarMensaje(pedido_cliente_id, remitente_id, mensaje);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { obtenerPedidos, obtenerPedidoPorId, actualizarEstado, actualizarPago, subirPrevia, enviarMensaje };