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
    const { tipo_pago, monto, comprobante_url } = req.body;

    console.log('📝 Subiendo comprobante:', { tipo_pago, monto, comprobante_url });

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


// ─── SUBIR DISEÑO ──────────────────────────────────────────────
const subirDiseno = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo_origen, archivo_url, simulador_json, notas_cliente } = req.body;
        const usuarioId = req.usuario.id_usuario;

        // 1. Verificar que el pedido existe y pertenece al usuario
        const pedido = await pedidoModel.obtenerDetallePedido(id, usuarioId);
        if (!pedido) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pedido no encontrado' 
            });
        }

        // 2. Verificar que el pedido está en estado EN_DISENO
        if (pedido.estado !== 'EN_DISENO') {
            return res.status(400).json({
                success: false,
                message: `El pedido no está en etapa de diseño. Estado actual: ${pedido.estado}`
            });
        }

        // 3. Validar que tenga al menos un tipo de diseño
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

        // 4. Guardar diseño
        const diseno = await disenoModel.guardarDiseno(
            id,
            tipo_origen,
            archivo_url || null,
            simulador_json || null,
            notas_cliente || null
        );

        // 5. Cambiar estado del pedido a EN_REVISION
        await pedidoModel.actualizarEstadoPedido(id, 'EN_REVISION');

        // 6. Crear notificación (el trigger lo hace automático)

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

        // Verificar que el pedido existe y pertenece al usuario
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

module.exports = {
  obtenerMetodosEntrega,
  crearPedido,
  obtenerDetallePedido,
  subirDiseno,
  obtenerDisenos,
  subirComprobante,
  obtenerPedidosUsuario
};