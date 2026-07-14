// backend/controllers/client/pedidoController.js
const pedidoModel = require('../../models/client/pedidoModel');
const metodosEntregaModel = require('../../models/client/metodosEntregaModel');
const metodosPagoModel = require('../../models/client/metodosPagoModel');
const carritoModel = require('../../models/client/carritoModel');
const disenoModel = require('../../models/client/disenoModel');

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

    // ─── VALIDACIONES ──────────────────────────────────────────────
    if (!metodo_entrega_id) {
      return res.status(400).json({ message: 'Se requiere método de entrega' });
    }

    if (!metodo_pago_id) {
      return res.status(400).json({ message: 'Se requiere método de pago' });
    }

    // ─── OBTENER MÉTODO DE ENTREGA ────────────────────────────────
    const metodo = await metodosEntregaModel.obtenerMetodoEntregaById(metodo_entrega_id);
    
    if (!metodo) {
      return res.status(400).json({ message: 'Método de entrega no válido' });
    }

    console.log('📦 Tipo de entrega:', metodo.tipo);
    console.log('📦 Dirección recibida:', direccion_envio);

    // ─── VALIDAR DIRECCIÓN SEGÚN EL TIPO ──────────────────────────
    let direccionFinal = direccion_envio;

    if (metodo.tipo === 'ENVIO_LOCAL') {
      // ✅ Para envío a domicilio, la dirección es OBLIGATORIA
      if (!direccion_envio || direccion_envio.trim() === '') {
        console.error('❌ ERROR: Dirección vacía para ENVIO_LOCAL');
        return res.status(400).json({ 
          message: 'La dirección de envío es requerida para envío a domicilio',
          error: 'DIRECCION_REQUERIDA'
        });
      }
      
      // ✅ Validar que la dirección tenga al menos 5 caracteres
      if (direccion_envio.trim().length < 5) {
        return res.status(400).json({ 
          message: 'La dirección debe ser más específica (mínimo 5 caracteres)',
          error: 'DIRECCION_CORTA'
        });
      }
      
      direccionFinal = direccion_envio.trim();
      
    } else if (metodo.tipo === 'RECOGIDA_FISICA' || metodo.tipo === 'PUNTO_MEDIO') {
      direccionFinal = metodo.descripcion || 'Dirección disponible en la confirmación del pedido';
    }

    console.log('📍 Dirección final:', direccionFinal);

    // ─── VERIFICAR CARRITO ─────────────────────────────────────────
    const totalCarrito = await carritoModel.obtenerTotalCarrito(usuarioId);
    if (totalCarrito === 0) {
      return res.status(400).json({ message: 'El carrito está vacío' });
    }

    // ─── CREAR PEDIDO ──────────────────────────────────────────────
    const pedido = await pedidoModel.crearPedidoDesdeCarrito(
      usuarioId,
      metodo_entrega_id,
      metodo_pago_id,
      direccionFinal,
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
    const { tipo_pago, monto, comprobante_url, notas_admin } = req.body;

    console.log('📝 Subiendo comprobante:', { tipo_pago, monto, comprobante_url, notas_admin });

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

    const pago = await pedidoModel.registrarPago(
      id,
      tipo_pago,
      monto,
      comprobante_url,
      notas_admin || null
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

// ─── SUBIR DISEÑO ──────────────────────────────────────────────
const subirDiseno = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_origen, archivo_url, simulador_json, notas_cliente } = req.body;
        const usuarioId = req.usuario.id_usuario;

        const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
        if (!pedido) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        if (pedido.estado !== 'EN_DISENO') {
            return res.status(400).json({
                success: false,
                message: `El pedido no está en etapa de diseño. Estado actual: ${pedido.estado}`
            });
        }

        if (tipo_origen === 'ARCHIVO_SUBIDO' && !archivo_url) {
            return res.status(400).json({
                success: false,
                message: 'La URL del archivo es requerida para ARCHIVO_SUBIDO'
            });
        }

        if (tipo_origen === 'SIMULADOR' && !simulador_json) {
            return res.status(400).json({
                success: false,
                message: 'El JSON del simulador es requerido para SIMULADOR'
            });
        }

        const diseno = await disenoModel.guardarDiseno(
            id,
            tipo_origen,
            archivo_url || null,
            simulador_json || null,
            notas_cliente || null
        );

        await pedidoModel.actualizarEstadoPedido(id, 'EN_REVISION');

        res.status(201).json({
            success: true,
            message: 'Diseño enviado correctamente',
            diseno,
            nuevo_estado: 'EN_REVISION'
        });

    } catch (error) {
        console.error('Error al subir diseño:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al subir diseño' 
        });
    }
};

// ─── OBTENER DISEÑOS DE UN PEDIDO ─────────────────────────────
const obtenerDisenos = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario.id_usuario;

        const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
        if (!pedido) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        const disenos = await disenoModel.obtenerDisenosPorPedido(id);

        res.json({
            success: true,
            disenos
        });

    } catch (error) {
        console.error('Error al obtener diseños:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al obtener diseños' 
        });
    }
};

// ─── PAGO FINAL ────────────────────────────────────────────────────
const pagoFinal = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id_usuario;
    const { monto, tipo_pago, notas_admin, comprobante_url } = req.body; // ✅ usar notas_admin

    console.log('💰 Procesando pago final:', { 
      pedidoId: id, 
      monto, 
      tipo_pago, 
      comprobante_url,
      notas_admin
    });

    if (!comprobante_url) {
      return res.status(400).json({ 
        success: false, 
        message: 'La URL del comprobante de pago es requerida' 
      });
    }

    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'El monto es requerido y debe ser mayor a 0' 
      });
    }

    const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
    
    if (!pedido) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido no encontrado' 
      });
    }

    if (pedido.estado !== 'PENDIENTE_PAGO_FINAL') {
      return res.status(400).json({
        success: false,
        message: `El pedido no está en estado de pago final. Estado actual: ${pedido.estado}`
      });
    }

    const montoPendiente = await pedidoModel.calcularMontoPendiente(id);
    
    if (Math.abs(parseFloat(monto) - montoPendiente) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `El monto no coincide con el saldo pendiente. Pendiente: $${montoPendiente.toFixed(2)}`
      });
    }

    // ✅ Usar notas_admin en lugar de observaciones
    const pago = await pedidoModel.registrarPagoFinal(
      id,
      tipo_pago || 'SALDO_FINAL',
      monto,
      comprobante_url,
      notas_admin || null
    );

    await pedidoModel.actualizarEstadoPedido(id, 'VERIFICANDO_PAGO_FINAL');

    res.status(201).json({
      success: true,
      message: 'Pago final registrado correctamente. Estamos verificando tu comprobante.',
      pago,
      nuevo_estado: 'VERIFICANDO_PAGO_FINAL'
    });

  } catch (error) {
    console.error('❌ Error en pago final:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago final: ' + error.message,
      error: error.message
    });
  }
};

module.exports = {
  obtenerMetodosEntrega,
  crearPedido,
  obtenerDetallePedido,
  subirDiseno,
  obtenerDisenos,
  subirComprobante,
  obtenerPedidosUsuario,
  pagoFinal 
};