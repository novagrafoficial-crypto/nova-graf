// backend/src/models/solicitudDisenoModel.js
const pool = require('../../config/db');

const SolicitudDisenoModel = {
  // Crear solicitud (cliente)
  async crear(usuario_id, variante_id, descripcion, archivosUrls) {
    const query = `
      INSERT INTO ventas.solicitudes_diseno 
      (usuario_id, variante_id, descripcion_cliente, archivos_referencia, estado)
      VALUES ($1, $2, $3, $4, 'pendiente_diseno')
      RETURNING *
    `;
    const values = [usuario_id, variante_id, descripcion, archivosUrls];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // Obtener solicitudes de un usuario
 async obtenerPorUsuario(usuario_id) {
  const query = `
    SELECT 
      s.id,
      s.descripcion_cliente,
      s.archivos_referencia,
      s.estado,
      s.fecha_solicitud,
      s.costo_diseno,
      s.observaciones_admin,
      json_build_object(
        'id',          v.id,
        'precio_base', p.precio_base,        -- ← viene de productos.productos
        'imagen_url',  v.imagen_url,
        'color',       col.nombre,
        'producto',    p.nombre
      ) AS variante,
      COALESCE(
        json_agg(
          json_build_object(
            'id',          prop.id,
            'imagen_url',  prop.imagen_url,
            'descripcion', prop.descripcion,
            'fecha_envio', prop.fecha_envio,
            'es_aprobada', prop.es_aprobada
          ) ORDER BY prop.fecha_envio
        ) FILTER (WHERE prop.id IS NOT NULL),
        '[]'
      ) AS propuestas
    FROM ventas.solicitudes_diseno s
    LEFT JOIN productos.producto_variantes v  ON s.variante_id = v.id
    LEFT JOIN productos.colores col           ON v.color_id = col.id
    LEFT JOIN productos.productos p           ON v.producto_id = p.id
    LEFT JOIN ventas.propuestas_diseno prop   ON s.id = prop.solicitud_id
    WHERE s.usuario_id = $1
    GROUP BY 
      s.id, s.descripcion_cliente, s.archivos_referencia, s.estado,
      s.fecha_solicitud, s.costo_diseno, s.observaciones_admin,
      v.id, v.imagen_url, col.nombre, p.nombre, p.precio_base
    ORDER BY s.fecha_solicitud DESC
  `;
  const { rows } = await pool.query(query, [usuario_id]);
  return rows;
},

  // Obtener una solicitud con sus propuestas y datos del usuario
  async obtenerPorId(id) {
    const query = `
      SELECT s.*, 
        json_build_object('id', u.id_usuario, 'nombre', u.nombre, 'email', u.correo_electronico) as usuario,
        COALESCE(
          json_agg(p ORDER BY p.fecha_envio) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as propuestas
      FROM ventas.solicitudes_diseno s
      JOIN usuarios u ON s.usuario_id = u.id_usuario
      LEFT JOIN ventas.propuestas_diseno p ON s.id = p.solicitud_id
      WHERE s.id = $1
      GROUP BY s.id, u.id_usuario
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  },

  // Obtener solicitudes pendientes (admin)
  async obtenerPendientes() {
    const query = `
      SELECT s.*, 
        json_build_object('id', u.id_usuario, 'nombre', u.nombre, 'email', u.correo_electronico) as usuario,
        json_build_object('id', v.id, 'color', v.color, 'precio_base', v.precio_base) as variante
      FROM ventas.solicitudes_diseno s
      JOIN usuarios u ON s.usuario_id = u.id_usuario
      LEFT JOIN productos.producto_variantes v ON s.variante_id = v.id
      WHERE s.estado IN ('pendiente_diseno', 'en_propuesta', 'propuesta_enviada')
      ORDER BY s.fecha_solicitud ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // Agregar propuesta (admin)
  async agregarPropuesta(solicitud_id, imagen_url, descripcion) {
    // Insertar propuesta
    const insertProp = `
      INSERT INTO ventas.propuestas_diseno (solicitud_id, imagen_url, descripcion)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows: [propuesta] } = await pool.query(insertProp, [solicitud_id, imagen_url, descripcion]);
    
    // Actualizar estado de la solicitud
    await pool.query(
      `UPDATE ventas.solicitudes_diseno SET estado = 'propuesta_enviada' WHERE id = $1`,
      [solicitud_id]
    );
    
    // Crear notificación (usando tu tabla notificaciones)
    await this.crearNotificacion(solicitud_id, `Nueva propuesta para tu solicitud #${solicitud_id}`);
    
    return propuesta;
  },

  // Aprobar propuesta (cliente) y agregar al carrito
  async aprobarPropuesta(solicitud_id, propuesta_id, costo_diseno, variante_id, precio_base_variante) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Marcar propuesta como aprobada
      await client.query(
        `UPDATE ventas.propuestas_diseno SET es_aprobada = TRUE WHERE id = $1`,
        [propuesta_id]
      );
      
      // 2. Obtener URL de la propuesta
      const { rows: [propuesta] } = await client.query(
        `SELECT imagen_url FROM ventas.propuestas_diseno WHERE id = $1`,
        [propuesta_id]
      );
      
      // 3. Crear producto personalizado
      const { rows: [productoPers] } = await client.query(
        `INSERT INTO productos.productos_personalizados 
         (variante_id, solicitud_diseno_id, imagen_personalizada_url, precio_adicional)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [variante_id, solicitud_id, propuesta.imagen_url, costo_diseno]
      );
      
      // 4. Obtener usuario_id de la solicitud
      const { rows: [solicitud] } = await client.query(
        `SELECT usuario_id FROM ventas.solicitudes_diseno WHERE id = $1`,
        [solicitud_id]
      );
      
      // 5. Agregar al carrito
      const precio_unitario = parseFloat(precio_base_variante) + parseFloat(costo_diseno);
      await client.query(
        `INSERT INTO ventas.carrito_compras 
         (usuario_id, producto_personalizado_id, cantidad, precio_unitario)
         VALUES ($1, $2, 1, $3)`,
        [solicitud.usuario_id, productoPers.id, precio_unitario]
      );
      
      // 6. Cambiar estado de la solicitud
      await client.query(
        `UPDATE ventas.solicitudes_diseno 
         SET estado = 'aprobado', fecha_aprobacion = NOW()
         WHERE id = $1`,
        [solicitud_id]
      );
      
      // 7. Notificar
      await this.crearNotificacion(solicitud_id, `Tu solicitud #${solicitud_id} fue aprobada. Producto agregado al carrito.`, client);
      
      await client.query('COMMIT');
      return productoPers;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Crear notificación (puedes usar tu tabla ventas.notificaciones)
  async crearNotificacion(solicitud_id, mensaje, client = pool) {
    // Primero obtener usuario_id
    const { rows: [solicitud] } = await client.query(
      `SELECT usuario_id FROM ventas.solicitudes_diseno WHERE id = $1`,
      [solicitud_id]
    );
    if (!solicitud) return;
    await client.query(
      `INSERT INTO ventas.notificaciones (usuario_id, solicitud_id, mensaje)
       VALUES ($1, $2, $3)`,
      [solicitud.usuario_id, solicitud_id, mensaje]
    );
  },

  async asignarCostoDiseno(solicitud_id, costo) {
    const query = `
      UPDATE ventas.solicitudes_diseno
      SET costo_diseno = $1
      WHERE id = $2
    `;
    await pool.query(query, [costo, solicitud_id]);
  },

  // Actualizar estado (admin)
  async actualizarEstado(solicitud_id, estado, observaciones = null) {
    const query = `
      UPDATE ventas.solicitudes_diseno
      SET estado = $1, observaciones_admin = COALESCE($2, observaciones_admin)
      WHERE id = $3
    `;
    await pool.query(query, [estado, observaciones, solicitud_id]);
  }
};


module.exports = SolicitudDisenoModel;