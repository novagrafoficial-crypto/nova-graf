// backend/controllers/client/pedidoController.js
const pedidoModel = require('../../models/client/pedidoModel');
const metodosEntregaModel = require('../../models/client/metodosEntregaModel');
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
    const { metodo_entrega_id, direccion_envio, distancia_km } = req.body;

    if (!metodo_entrega_id) {
      return res.status(400).json({ message: 'Se requiere método de entrega' });
    }

    if (!direccion_envio || direccion_envio.trim() === '') {
      return res.status(400).json({ message: 'Se requiere dirección de envío' });
    }

    const totalCarrito = await carritoModel.obtenerTotalCarrito(usuarioId);
    if (totalCarrito === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    const pedido = await pedidoModel.crearPedidoDesdeCarrito(
      usuarioId,
      metodo_entrega_id,
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

// ─── SUBIR COMPROBANTE (SOLO GUARDA URL) ──────────────────────────
const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_pago, monto, metodo_pago, comprobante_url } = req.body;

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

    // 🔥 SOLO GUARDAR LA URL EN LA BASE DE DATOS
    const pago = await pedidoModel.registrarPago(
      id,
      tipo_pago,
      monto,
      metodo_pago,
      comprobante_url // ← URL que viene del frontend
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

// ─── SUBIR DISEÑO (SOLO GUARDA URL) ──────────────────────────────
const subirDiseno = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_origen, archivo_url, simulador_json, notas_cliente } = req.body;
    const usuarioId = req.usuario.id_usuario;

    const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (pedido.estado !== 'PENDIENTE_VERIFICACION') {
      return res.status(400).json({
        message: `El pedido no está en etapa de diseño. Estado actual: ${pedido.estado}`
      });
    }

    // 🔥 GUARDAR EN ventas.disenos_clientes
    // (Necesitas crear el modelo de disenos)

    // Cambiar estado a UNDER_REVIEW
    await pedidoModel.actualizarEstadoPedido(id, 'EN_REVISION');

    res.json({
      success: true,
      message: 'Diseño enviado correctamente',
      archivo_url: archivo_url
    });

  } catch (error) {
    console.error('Error al subir diseño:', error);
    res.status(500).json({ message: 'Error al subir diseño' });
  }
};

// ─── CREAR PREVIA (SOLO GUARDA URL) ──────────────────────────────
const crearPrevia = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero_previa, imagen_url } = req.body;
    const usuarioId = req.usuario.id_usuario;

    if (!numero_previa || ![1, 2].includes(numero_previa)) {
      return res.status(400).json({ message: 'Número de previa inválido (1 o 2)' });
    }

    if (!imagen_url) {
      return res.status(400).json({ message: 'La URL de la imagen es requerida' });
    }

    const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // 🔥 GUARDAR EN ventas.previas_diseno
    // (Necesitas crear el modelo de previas)

    // Cambiar estado a PREVIEWS_SENT
    await pedidoModel.actualizarEstadoPedido(id, 'PREVIAS_ENVIADAS');

    res.json({
      success: true,
      message: 'Previa creada correctamente',
      imagen_url: imagen_url
    });

  } catch (error) {
    console.error('Error al crear previa:', error);
    res.status(500).json({ message: 'Error al crear previa' });
  }
};

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

// Y en module.exports agrégala:
module.exports = {
  obtenerMetodosEntrega,
  crearPedido,
  obtenerDetallePedido,
  subirComprobante,
  subirDiseno,
  crearPrevia,
  obtenerPedidosUsuario  
};
