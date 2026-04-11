const ventaModel = require('../../models/client/ventaModel');

const procesarCheckout = async (req, res) => {
  const usuarioId = req.usuario.id_usuario;
  const { formaPago, formaEntrega, direccion, datosTarjeta } = req.body;

  try {
    // 1. Validar carrito
    const items = await ventaModel.obtenerItemsCarrito(usuarioId);
    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío' });
    }

    // 2. Calcular total
    let totalVenta = 0;
    items.forEach(item => {
      totalVenta += item.cantidad * item.precio_unitario;
    });

    // 3. Calcular anticipo
    let anticipo = 0;
    if (formaPago === 'efectivo') {
      anticipo = totalVenta; // 100%
    } else {
      anticipo = totalVenta * 0.5; // 50% para tarjeta o depósito
    }
    const saldo = totalVenta - anticipo;

    // 4. Validar datos de tarjeta (solo simulación)
    if (formaPago === 'tarjeta') {
      if (!datosTarjeta || !datosTarjeta.numero || !datosTarjeta.fecha || !datosTarjeta.cvv) {
        return res.status(400).json({ error: 'Datos de tarjeta incompletos' });
      }
      const numLimpio = datosTarjeta.numero.replace(/\s/g, '');
      if (numLimpio.length < 16) {
        return res.status(400).json({ error: 'Número de tarjeta inválido' });
      }
      // Aquí podrías agregar validación de fecha, etc.
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

    // 6. Insertar detalles de venta
    for (const item of items) {
      await ventaModel.agregarDetalleVenta(
        venta.id,
        item.producto_personalizado_id,
        item.cantidad,
        item.precio_unitario
      );
    }

    // 7. Registrar el pago (anticipo)
    const nombreMetodo = formaPago.charAt(0).toUpperCase() + formaPago.slice(1); // 'Tarjeta', 'Depósito', 'Efectivo'
    const metodoPagoId = await ventaModel.obtenerMetodoPagoId(nombreMetodo);
    if (metodoPagoId) {
      await ventaModel.registrarPago(venta.id, metodoPagoId, anticipo);
    } else {
      console.warn(`Método de pago no encontrado: ${nombreMetodo}`);
    }

    // 8. Vaciar carrito
    await ventaModel.vaciarCarrito(usuarioId);

    // 9. Responder éxito
    res.json({
      success: true,
      ventaId: venta.id,
      mensaje: 'Compra procesada correctamente. Pronto recibirás confirmación.'
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    res.status(500).json({ error: 'Error al procesar el pago. Intenta de nuevo.' });
  }
};

module.exports = {
  procesarCheckout,
};