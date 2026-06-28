// backend/models/client/previaModel.js
const pool = require('../../config/db');

const PreviaModel = {
  // ─── CREAR PREVIA ──────────────────────────────────────────────
  async crear(pedidoId, numeroPrevia, imagenUrl) {
    const query = `
      INSERT INTO ventas.previas_diseno (
        pedido_cliente_id,
        numero_previa,
        imagen_url,
        fecha_subida
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (pedido_cliente_id, numero_previa) 
      DO UPDATE SET 
        imagen_url = $3,
        fecha_subida = NOW(),
        aprobada = false
      RETURNING *
    `;
    const { rows } = await pool.query(query, [pedidoId, numeroPrevia, imagenUrl]);
    return rows[0];
  },

  // ─── OBTENER PREVIAS DE UN PEDIDO ─────────────────────────────
  async obtenerPorPedido(pedidoId) {
    const query = `
      SELECT * FROM ventas.previas_diseno
      WHERE pedido_cliente_id = $1
      ORDER BY numero_previa ASC
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows;
  },

  // ─── APROBAR PREVIA ────────────────────────────────────────────
  async aprobar(pedidoId, numeroPrevia) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Marcar previa como aprobada
      const queryUpdate = `
        UPDATE ventas.previas_diseno 
        SET aprobada = TRUE, fecha_aprobacion = NOW()
        WHERE pedido_cliente_id = $1 AND numero_previa = $2
        RETURNING *
      `;
      const { rows } = await client.query(queryUpdate, [pedidoId, numeroPrevia]);
      
      if (rows.length === 0) {
        throw new Error('Previa no encontrada');
      }

      // Cambiar estado del pedido a IN_PRODUCTION
      await client.query(
        `UPDATE ventas.pedidos_clientes 
         SET estado = 'IN_PRODUCTION' 
         WHERE id = $1`,
        [pedidoId]
      );

      await client.query('COMMIT');
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = PreviaModel;