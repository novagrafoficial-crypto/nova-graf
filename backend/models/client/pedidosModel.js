// models/client/pedidosModel.js
const pool = require('../../config/db');

// models/client/pedidosModel.js
const pedidosModel = {
  obtenerPorUsuario: async (usuarioId) => {
    const query = `
      SELECT 
        v.id,
        v.fecha_venta AS fecha,
        v.total_venta::FLOAT AS total,        -- ✅ cast a número
        v.forma_entrega,
        v.forma_pago,
        v.estado_pedido AS estado,
        json_agg(
          json_build_object(
            'nombre', p.nombre,
            'cantidad', vd.cantidad,
            'precio_unitario', vd.precio_unitario::FLOAT,  -- ✅ cast a número
            'imagen', pp.imagen_personalizada_url,
            'texto_personalizado', pp.texto_personalizado,
            'color', col.nombre
          )
        ) AS items
      FROM inventario.ventas v
      JOIN inventario.ventas_detalle vd ON v.id = vd.venta_id
      JOIN productos.productos_personalizados pp ON vd.producto_personalizado_id = pp.id
      JOIN productos.producto_variantes pv ON pp.variante_id = pv.id
      JOIN productos.productos p ON pv.producto_id = p.id
      LEFT JOIN productos.colores col ON pv.color_id = col.id
      WHERE v.usuario_id = $1
      GROUP BY v.id
      ORDER BY v.fecha_venta DESC
    `;
    const { rows } = await pool.query(query, [usuarioId]);
    return rows;
  },

  // cancelar queda igual...
};

module.exports = pedidosModel;