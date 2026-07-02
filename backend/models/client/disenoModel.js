// backend/models/client/disenoModel.js
const pool = require('../../config/db');

const DisenoModel = {
  // ─── CREAR DISEÑO PARA UN PEDIDO ──────────────────────────────
  async crear(pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente) {
    const query = `
      INSERT INTO ventas.disenos_clientes (
        pedido_cliente_id,
        tipo_origen,
        archivo_url,
        simulador_json,
        notas_cliente,
        fecha_envio
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const values = [pedidoId, tipoOrigen, archivoUrl, simuladorJson, notasCliente];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // ─── OBTENER DISEÑOS DE UN PEDIDO ─────────────────────────────
  async obtenerPorPedido(pedidoId) {
    const query = `
      SELECT * FROM ventas.disenos_clientes
      WHERE pedido_cliente_id = $1
      ORDER BY fecha_envio DESC
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows;
  },

  // ─── OBTENER ÚLTIMO DISEÑO DE UN PEDIDO ──────────────────────
  async obtenerUltimo(pedidoId) {
    const query = `
      SELECT * FROM ventas.disenos_clientes
      WHERE pedido_cliente_id = $1
      ORDER BY fecha_envio DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [pedidoId]);
    return rows[0] || null;
  }
};

module.exports = DisenoModel;