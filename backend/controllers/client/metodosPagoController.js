// backend/controllers/client/metodosPagoController.js
const metodosPagoModel = require('../../models/client/metodosPagoModel');

// ─── CLIENTE ─────────────────────────────────────────────────────────

/**
 * Obtener métodos de pago disponibles para el cliente
 * @route GET /api/client/checkout/metodos-pago
 */
const obtenerMetodosPagoCliente = async (req, res) => {
  try {
    const metodos = await metodosPagoModel.obtenerMetodosPago();
    res.json(metodos);
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener métodos de pago' 
    });
  }
};

/**
 * Obtener detalle de un método de pago específico
 * @route GET /api/client/checkout/metodos-pago/:id
 */
const obtenerMetodoPagoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await metodosPagoModel.obtenerMetodoPagoById(id);
    
    if (!metodo) {
      return res.status(404).json({ 
        success: false, 
        message: 'Método de pago no encontrado' 
      });
    }
    
    res.json(metodo);
  } catch (error) {
    console.error('Error al obtener método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener método de pago' 
    });
  }
};

// ─── ADMIN ──────────────────────────────────────────────────────────

/**
 * Obtener todos los métodos de pago (Admin)
 * @route GET /api/admin/metodos-pago
 */
const obtenerTodosMetodosPago = async (req, res) => {
  try {
    const metodos = await metodosPagoModel.obtenerTodosMetodosPago();
    res.json({
      success: true,
      data: metodos
    });
  } catch (error) {
    console.error('Error al obtener métodos de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener métodos de pago' 
    });
  }
};

/**
 * Crear un nuevo método de pago (Admin)
 * @route POST /api/admin/metodos-pago
 */
const crearMetodoPago = async (req, res) => {
  try {
    const { 
      nombre, 
      tipo, 
      descripcion, 
      instrucciones, 
      datos_bancarios, 
      requiere_comprobante, 
      orden 
    } = req.body;

    // Validaciones
    if (!nombre || !tipo) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y tipo son obligatorios'
      });
    }

    // Validar tipo
    const tiposValidos = ['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'TARJETA', 'PAYPAL'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo inválido. Tipos permitidos: ${tiposValidos.join(', ')}`
      });
    }

    const nuevoMetodo = await metodosPagoModel.crearMetodoPago({
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      orden
    });

    res.status(201).json({
      success: true,
      message: 'Método de pago creado exitosamente',
      data: nuevoMetodo
    });

  } catch (error) {
    console.error('Error al crear método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear método de pago' 
    });
  }
};

/**
 * Actualizar un método de pago (Admin)
 * @route PUT /api/admin/metodos-pago/:id
 */
const actualizarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      tipo, 
      descripcion, 
      instrucciones, 
      datos_bancarios, 
      requiere_comprobante, 
      activo,
      orden 
    } = req.body;

    // Verificar que existe
    const existe = await metodosPagoModel.obtenerMetodoPagoById(id);
    if (!existe) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    const metodoActualizado = await metodosPagoModel.actualizarMetodoPago(id, {
      nombre,
      tipo,
      descripcion,
      instrucciones,
      datos_bancarios,
      requiere_comprobante,
      activo,
      orden
    });

    res.json({
      success: true,
      message: 'Método de pago actualizado exitosamente',
      data: metodoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar método de pago' 
    });
  }
};

/**
 * Eliminar (desactivar) un método de pago (Admin)
 * @route DELETE /api/admin/metodos-pago/:id
 */
const eliminarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const existe = await metodosPagoModel.obtenerMetodoPagoById(id);
    if (!existe) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    await metodosPagoModel.eliminarMetodoPago(id);

    res.json({
      success: true,
      message: 'Método de pago eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar método de pago' 
    });
  }
};

/**
 * Cambiar estado de un método de pago (Activar/Desactivar)
 * @route PATCH /api/admin/metodos-pago/:id/toggle
 */
const toggleMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const metodo = await metodosPagoModel.actualizarMetodoPago(id, { activo });

    if (!metodo) {
      return res.status(404).json({
        success: false,
        message: 'Método de pago no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Método de pago ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: metodo
    });

  } catch (error) {
    console.error('Error al cambiar estado del método de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar estado del método de pago' 
    });
  }
};

/**
 * Reordenar métodos de pago (Admin)
 * @route PUT /api/admin/metodos-pago/reordenar
 */
const reordenarMetodosPago = async (req, res) => {
  try {
    const { ordenes } = req.body;

    if (!ordenes || !Array.isArray(ordenes)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de órdenes'
      });
    }

    for (const item of ordenes) {
      await metodosPagoModel.actualizarMetodoPago(item.id, { orden: item.orden });
    }

    const metodos = await metodosPagoModel.obtenerTodosMetodosPago();

    res.json({
      success: true,
      message: 'Orden actualizado exitosamente',
      data: metodos
    });

  } catch (error) {
    console.error('Error al reordenar métodos de pago:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al reordenar métodos de pago' 
    });
  }
};

module.exports = {
  // Cliente
  obtenerMetodosPagoCliente,
  obtenerMetodoPagoCliente,
  
  // Admin
  obtenerTodosMetodosPago,
  crearMetodoPago,
  actualizarMetodoPago,
  eliminarMetodoPago,
  toggleMetodoPago,
  reordenarMetodosPago
};