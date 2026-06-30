// backend/controllers/client/pedidoController.js
const pedidoModel = require('../../models/client/pedidoModel');
const metodosEntregaModel = require('../../models/client/metodosEntregaModel');
const metodosPagoModel = require('../../models/client/metodosPagoModel');
const carritoModel = require('../../models/client/carritoModel');

// ─── OBTENER MÉTODOS DE ENTREGA ────────────────────────────────────
const obtenerMetodosEntrega = async (req, res) => {
  try {
    const metodos = await metodosEntregaModel.obtenerMetodosEntrega();
    res.json(metodos);
  } catch (error) {
    console.error('Error al obtener métodos de entrega:', error);
    res.status(500).json({ message: 'Error al obtener métodos de entrega' });
  }
};

// ─── CREAR PEDIDO DESDE CARRITO ────────────────────────────────────
const crearPedido = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const { metodo_entrega_id, metodo_pago_id, direccion_envio, distancia_km } = req.body;

    console.log('📝 Creando pedido:', { metodo_entrega_id, metodo_pago_id, direccion_envio, distancia_km });

    // Validaciones
    if (!metodo_entrega_id) {
      return res.status(400).json({ message: 'Se requiere método de entrega' });
    }

    if (!metodo_pago_id) {
      return res.status(400).json({ message: 'Se requiere método de pago' });
    }

    if (!direccion_envio || direccion_envio.trim() === '') {
      return res.status(400).json({ message: 'Se requiere dirección de envío' });
    }

    const totalCarrito = await carritoModel.obtenerTotalCarrito(usuarioId);
    if (totalCarrito === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    // ✅ Crear pedido CON metodo_pago_id
    const pedido = await pedidoModel.crearPedidoDesdeCarrito(
      usuarioId,
      metodo_entrega_id,
      metodo_pago_id,  // ← NUEVO PARÁMETRO
      direccion_envio,
      distancia_km || 0
    );

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      pedido_id: pedido.pedidoId,
      total_general: pedido.totalGeneral,
      monto_anticipo: pedido.montoAnticipo,
      monto_restante: pedido.montoRestante,
      costo_envio: pedido.costoEnvio,
      estado: 'PENDIENTE_VERIFICACION'
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ 
      message: error.message || 'Error al crear el pedido' 
    });
  }
};

// ─── OBTENER DETALLE DEL PEDIDO ────────────────────────────────────
const obtenerDetallePedido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id_usuario;

    const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
    
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    res.json(pedido);
  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    res.status(500).json({ message: 'Error al obtener detalle del pedido' });
  }
};

// ─── SUBIR COMPROBANTE ──────────────────────────────────────────
const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_pago, monto, metodo_pago_id, comprobante_url } = req.body;

    if (!comprobante_url) {
      return res.status(400).json({ message: 'La URL del comprobante es requerida' });
    }

    if (!['ANTICIPO', 'SALDO_FINAL'].includes(tipo_pago)) {
      return res.status(400).json({ message: 'Tipo de pago inválido' });
    }

    const usuarioId = req.usuario.id_usuario;
    const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (tipo_pago === 'ANTICIPO' && pedido.estado !== 'PENDIENTE_VERIFICACION') {
      return res.status(400).json({
        message: `El pedido no está en espera de anticipo. Estado actual: ${pedido.estado}`
      });
    }

    // ✅ Registrar pago CON metodo_pago_id
    const pago = await pedidoModel.registrarPago(
      id,
      tipo_pago,
      monto,
      metodo_pago_id,  // ← ID del método de pago
      comprobante_url
    );

    res.status(201).json({
      success: true,
      message: 'Comprobante registrado, esperando verificación del administrador',
      pago
    });

  } catch (error) {
    console.error('Error al subir comprobante:', error);
    res.status(500).json({ message: 'Error al subir comprobante' });
  }
};

// ─── OBTENER PEDIDOS DEL USUARIO ──────────────────────────────────
const obtenerPedidosUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    const pedidos = await pedidoModel.obtenerPedidosUsuario(usuarioId);
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
};

module.exports = {
  obtenerMetodosEntrega,
  crearPedido,
  obtenerDetallePedido,
  subirComprobante,
  obtenerPedidosUsuario
};