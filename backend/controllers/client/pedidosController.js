// controllers/client/pedidosController.js
const pool = require('../../config/db');

// ─── OBTENER PEDIDOS DEL USUARIO ──────────────────────────────────
const obtenerPedidos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id_usuario;
    
    const query = `
      SELECT 
        p.id,
        p.fecha_pedido,
        p.total_general,
        p.estado,
        p.monto_anticipo,
        p.monto_restante,
        p.fecha_entrega_estimada,
        me.nombre AS metodo_entrega
      FROM ventas.pedidos_clientes p
      JOIN ventas.metodos_entrega me ON p.metodo_entrega_id = me.id
      WHERE p.usuario_id = $1
      ORDER BY p.fecha_pedido DESC
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ message: 'Error al obtener pedidos' });
  }
};

// ─── CANCELAR PEDIDO ────────────────────────────────────────────────
const cancelarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id_usuario;

    const queryCheck = `
      SELECT id, estado FROM ventas.pedidos_clientes 
      WHERE id = $1 AND usuario_id = $2
    `;
    const checkResult = await pool.query(queryCheck, [id, usuarioId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const pedido = checkResult.rows[0];
    const estadosCancelables = ['WAITING_DEPOSIT_VERIFICATION', 'DESIGNING'];
    
    if (!estadosCancelables.includes(pedido.estado)) {
      return res.status(400).json({
        message: `No se puede cancelar el pedido en estado: ${pedido.estado}`
      });
    }

    const queryUpdate = `
      UPDATE ventas.pedidos_clientes 
      SET estado = 'CANCELED' 
      WHERE id = $1 
      RETURNING *
    `;
    const { rows } = await pool.query(queryUpdate, [id]);

    res.json({
      message: 'Pedido cancelado exitosamente',
      pedido: rows[0]
    });

  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ message: 'Error al cancelar el pedido' });
  }
};

// ─── FUNCIONES PLACEHOLDER ──────────────────────────────────────────
const obtenerDetallePedido = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const obtenerMetadatosPedido = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const crearPedido = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const subirComprobante = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const subirDiseno = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const enviarMensaje = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

const aprobarPrevia = async (req, res) => {
  res.status(501).json({ message: 'Función no implementada aún' });
};

module.exports = {
  obtenerPedidos,
  obtenerDetallePedido,
  obtenerMetadatosPedido,
  crearPedido,
  cancelarPedido,
  subirComprobante,
  subirDiseno,
  enviarMensaje,
  aprobarPrevia
};