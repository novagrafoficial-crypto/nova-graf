// backend/models/client/Descuento.js
const pool = require('../../config/db');

class Descuento {
  // ─── FILAS PLANAS: cada fila = 1 variante afectada por 1 descuento activo ───
  // Resuelve los dos casos posibles en marketing.descuento_productos:
  //  - dp.producto_id  IS NOT NULL  -> el descuento aplica a TODAS las
  //    variantes activas de ese producto
  //  - dp.variante_id  IS NOT NULL  -> el descuento aplica SOLO a esa
  //    variante especifica
  static async getDescuentosConVariantes() {
    try {
      const query = `
        WITH descuentos_activos AS (
          SELECT *
          FROM marketing.descuentos
          WHERE activo = true
            AND fecha_inicio <= CURRENT_DATE
            AND fecha_fin >= CURRENT_DATE
        )
        -- Caso 1: descuento aplicado a TODO el producto
        SELECT
          d.id             AS descuento_id,
          d.nombre         AS descuento_nombre,
          d.tipo,
          d.valor,
          d.cantidad_minima,
          d.fecha_inicio,
          d.fecha_fin,
          dp.prioridad,
          'producto'       AS tipo_aplicacion,
          p.id             AS producto_id,
          p.nombre         AS producto_nombre,
          p.precio_base,
          v.id             AS variante_id,
          v.sku,
          v.precio_adicional,
          v.imagen_url,
          c.nombre         AS color_nombre
        FROM descuentos_activos d
        JOIN marketing.descuento_productos dp
          ON dp.descuento_id = d.id AND dp.producto_id IS NOT NULL
        JOIN productos.productos p
          ON p.id = dp.producto_id AND p.activo = true
        JOIN productos.producto_variantes v
          ON v.producto_id = p.id AND v.activo = true
        LEFT JOIN productos.colores c ON c.id = v.color_id

        UNION ALL

        -- Caso 2: descuento aplicado a UNA variante especifica
        SELECT
          d.id             AS descuento_id,
          d.nombre         AS descuento_nombre,
          d.tipo,
          d.valor,
          d.cantidad_minima,
          d.fecha_inicio,
          d.fecha_fin,
          dp.prioridad,
          'variante'       AS tipo_aplicacion,
          p.id             AS producto_id,
          p.nombre         AS producto_nombre,
          p.precio_base,
          v.id             AS variante_id,
          v.sku,
          v.precio_adicional,
          v.imagen_url,
          c.nombre         AS color_nombre
        FROM descuentos_activos d
        JOIN marketing.descuento_productos dp
          ON dp.descuento_id = d.id AND dp.variante_id IS NOT NULL
        JOIN productos.producto_variantes v
          ON v.id = dp.variante_id AND v.activo = true
        JOIN productos.productos p
          ON p.id = v.producto_id AND p.activo = true
        LEFT JOIN productos.colores c ON c.id = v.color_id

        ORDER BY prioridad DESC NULLS LAST, descuento_id, producto_id, variante_id
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error en getDescuentosConVariantes:', error);
      throw error;
    }
  }

  // ─── CALCULAR PRECIO FINAL ──────────────────────
 static calcularPrecioFinal(precioBase, precioAdicional, tipo, valor) {
  const base = parseFloat(precioBase) + parseFloat(precioAdicional || 0);
  const val = parseFloat(valor);
  const tipoNorm = (tipo || '').toLowerCase(); // 👈 nuevo

  if (tipoNorm === 'porcentaje') {
    return Math.max(0, base * (1 - val / 100));
  }
  if (tipoNorm === 'fijo') {
    return Math.max(0, base - val);
  }
  return base;
}
  // ─── APLICAR DESCUENTOS A RENGLONES DEL CARRITO / PEDIDO ──────
  // Recibe filas con { variante_id, cantidad, precio_base, precio_adicional }
  // y regresa las mismas filas con el precio ya rebajado:
  //   precio_original  -> precio sin descuento
  //   precio_unitario  -> precio que se cobra (con descuento si aplica)
  //   subtotal         -> cantidad * precio_unitario
  //   descuento_id / descuento_nombre / ahorro
  //   descuento_pendiente -> { nombre, cantidad_minima, faltan } si hay una
  //                          oferta pero todavia no llega a la cantidad minima
  // Si una variante tiene varios descuentos, se usa el que deja el precio mas bajo.
  static async aplicarDescuentos(items) {
    const filas = await this.getDescuentosConVariantes();

    // variante_id -> lista de descuentos activos para esa variante
    const porVariante = new Map();
    filas.forEach(f => {
      const lista = porVariante.get(f.variante_id) || [];
      lista.push(f);
      porVariante.set(f.variante_id, lista);
    });

    return items.map(item => {
      const cantidad = parseInt(item.cantidad, 10) || 0;
      const precioOriginal = parseFloat(item.precio_base) + parseFloat(item.precio_adicional || 0);
      const candidatos = porVariante.get(item.variante_id) || [];

      let mejor = null;      // descuento que si aplica
      let pendiente = null;  // descuento al que le faltan piezas
      candidatos.forEach(d => {
        const minima = parseInt(d.cantidad_minima, 10) || 1;
        const final = this.calcularPrecioFinal(item.precio_base, item.precio_adicional, d.tipo, d.valor);
        if (cantidad >= minima) {
          if (!mejor || final < mejor.final) mejor = { d, final };
        } else if (!pendiente || minima < pendiente.cantidad_minima) {
          pendiente = { nombre: d.descuento_nombre, cantidad_minima: minima, faltan: minima - cantidad };
        }
      });

      const precioUnitario = mejor ? parseFloat(mejor.final.toFixed(2)) : precioOriginal;
      const ahorro = parseFloat(((precioOriginal - precioUnitario) * cantidad).toFixed(2));

      return {
        ...item,
        precio_original: parseFloat(precioOriginal.toFixed(2)),
        precio_unitario: precioUnitario,
        subtotal: parseFloat((precioUnitario * cantidad).toFixed(2)),
        descuento_id: mejor ? mejor.d.descuento_id : null,
        descuento_nombre: mejor ? mejor.d.descuento_nombre : null,
        ahorro,
        descuento_pendiente: mejor ? null : pendiente
      };
    });
  }

  // ─── OFERTAS AGRUPADAS (para /api/client/ofertas) ──────────
  // Agrupa por descuento y dentro trae la lista de variantes con
  // precio_original y precio_final ya calculados, listos para pintar.
  static async getOfertasAgrupadas() {
    try {
      const filas = await this.getDescuentosConVariantes();
      const ofertasMap = new Map();

      filas.forEach(row => {
        if (!ofertasMap.has(row.descuento_id)) {
          ofertasMap.set(row.descuento_id, {
            id: row.descuento_id,
            nombre: row.descuento_nombre,
            tipo:  (row.tipo || '').toLowerCase(),
            valor: parseFloat(row.valor),
            cantidad_minima: row.cantidad_minima || 1,
            fecha_inicio: row.fecha_inicio,
            fecha_fin: row.fecha_fin,
            tipo_aplicacion: row.tipo_aplicacion,
            variantes: []
          });
        }

        const oferta = ofertasMap.get(row.descuento_id);
        const yaExiste = oferta.variantes.some(v => v.variante_id === row.variante_id);

        if (!yaExiste) {
          const precioOriginal = parseFloat(row.precio_base) + parseFloat(row.precio_adicional || 0);
          const precioFinal = this.calcularPrecioFinal(
            row.precio_base,
            row.precio_adicional,
            row.tipo,
            row.valor
          );

          oferta.variantes.push({
            variante_id: row.variante_id,
            producto_id: row.producto_id,
            producto_nombre: row.producto_nombre,
            sku: row.sku,
            color: row.color_nombre || 'Standard',
            imagen: row.imagen_url || '/default-product.jpg',
            precio_original: parseFloat(precioOriginal.toFixed(2)),
            precio_final: parseFloat(precioFinal.toFixed(2))
          });
        }
      });

      return Array.from(ofertasMap.values());
    } catch (error) {
      console.error('Error en getOfertasAgrupadas:', error);
      throw error;
    }
  }

  // ─── DETALLE DE UNA OFERTA (para /api/client/ofertas/:id) ───
  static async getOfertaDetalle(id) {
    try {
      const ofertas = await this.getOfertasAgrupadas();
      return ofertas.find(o => o.id === parseInt(id)) || null;
    } catch (error) {
      console.error('Error en getOfertaDetalle:', error);
      throw error;
    }
  }

  // ─── OFERTAS DE UN PRODUCTO ESPECIFICO ──────────
  // Util para la ficha de producto: variantes de ese producto que
  // tienen algun descuento activo, ya sea por producto o por variante.
  static async getOfertasByProducto(productoId) {
    try {
      const filas = await this.getDescuentosConVariantes();
      const filtradas = filas.filter(f => f.producto_id === parseInt(productoId));

      return filtradas.map(row => {
        const precioOriginal = parseFloat(row.precio_base) + parseFloat(row.precio_adicional || 0);
        const precioFinal = this.calcularPrecioFinal(
          row.precio_base,
          row.precio_adicional,
          row.tipo,
          row.valor
        );

        return {
          descuento_id: row.descuento_id,
          nombre_descuento: row.descuento_nombre,
          tipo: (row.tipo || '').toLowerCase(),
          valor: parseFloat(row.valor),
          variante_id: row.variante_id,
          sku: row.sku,
          color: row.color_nombre || 'Standard',
          imagen: row.imagen_url || '/default-product.jpg',
          precio_original: parseFloat(precioOriginal.toFixed(2)),
          precio_final: parseFloat(precioFinal.toFixed(2))
        };
      });
    } catch (error) {
      console.error('Error en getOfertasByProducto:', error);
      throw error;
    }
  }
}

module.exports = Descuento;
