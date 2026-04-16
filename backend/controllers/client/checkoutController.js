const ventaModel = require('../../models/client/ventaModel');

const procesarCheckout = async (req, res) => {
  const usuarioId = req.usuario.id_usuario; // Ajusta según tu middleware
  const { formaPago, formaEntrega, direccion, datosTarjeta } = req.body;

  try {
    // 1. Obtener items del carrito (con precios reales)
    const items = await ventaModel.obtenerItemsCarrito(usuarioId);
    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // 2. Calcular total REAL (seguridad)
    let totalVenta = 0;
    items.forEach(item => {
      totalVenta += item.cantidad * item.precio_unitario;
    });

    // 3. Calcular anticipo según forma de pago
    let anticipo = 0;
    if (formaPago === 'efectivo') {
      anticipo = totalVenta;
    } else {
      anticipo = totalVenta * 0.5; // 50% para tarjeta o depósito
    }
    const saldo = totalVenta - anticipo;

    // 4. Validar tarjeta (solo simulación)
    if (formaPago === 'tarjeta') {
      if (!datosTarjeta?.numero || !datosTarjeta?.fecha || !datosTarjeta?.cvv) {
        return res.status(400).json({ error: 'Datos de tarjeta incompletos' });
      }
      const numLimpio = datosTarjeta.numero.replace(/\s/g, '');
      if (numLimpio.length < 16) {
        return res.status(400).json({ error: 'Número de tarjeta inválido' });
      }
    }

    // 5. Crear la venta
    const venta = await ventaModel.crearVenta(
      usuarioId,
      totalVenta,
      anticipo,
      saldo,
      formaPago,
      formaEntrega,
      formaEntrega === 'domicilio' ? direccion : null
    );

    // 6. Insertar detalles (ahora con variante_id)
    for (const item of items) {
      await ventaModel.agregarDetalleVenta(
        venta.id,
        item.producto_personalizado_id,
        item.cantidad,
        item.precio_unitario
      );
    }

    // 7. Registrar el pago (anticipo)
    const metodoPagoId = await ventaModel.obtenerMetodoPagoId(formaPago);
    if (metodoPagoId) {
      await ventaModel.registrarPago(venta.id, metodoPagoId, anticipo);
    } else {
      console.warn(`Método de pago no encontrado: ${formaPago}`);
    }

    // 8. Vaciar carrito
    await ventaModel.vaciarCarrito(usuarioId);

    res.json({
      success: true,
      ventaId: venta.id,
      mensaje: 'Compra procesada correctamente. Se ha descontado el inventario.'
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la compra' });
  }
};

module.exports = { procesarCheckout };