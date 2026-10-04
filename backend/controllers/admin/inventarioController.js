// controllers/admin/inventarioController.js

const inventarioModel = require('../../models/admin/inventarioModel');

// ─── Validar campos requeridos ────────────────────────────────────────────────
const validarCamposRequeridos = (data) => {
  const requeridos = ['variante_id', 'cantidad_disponible'];
  const faltantes = requeridos.filter(
    (campo) => data[campo] === undefined || data[campo] === null || data[campo] === ''
  );
  return faltantes;
};

// ─── GET todos ────────────────────────────────────────────────────────────────
const getInventario = async (req, res) => {
  try {
    const data = await inventarioModel.obtenerInventario();
    res.json(data);
  } catch (err) {
    console.error('[getInventario]', err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

// ─── GET por ID ───────────────────────────────────────────────────────────────
const getInventarioPorId = async (req, res) => {
  try {
    const item = await inventarioModel.obtenerInventarioPorId(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventario no encontrado' });
    }
    res.json(item);
  } catch (err) {
    console.error('[getInventarioPorId]', err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

// ─── POST crear ───────────────────────────────────────────────────────────────
const createInventario = async (req, res) => {
  try {
    const data = { ...req.body };

    // Validar campos requeridos
    const faltantes = validarCamposRequeridos(data);
    if (faltantes.length > 0) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        faltantes,
      });
    }

    // Convertir ventas diarias a demanda anual
    if (data.ventas_diarias !== undefined) {
      data.demanda_anual = parseFloat(data.ventas_diarias) * 365;
    }

    // Valores por defecto documentados
    if (!data.costo_pedido)       data.costo_pedido       = 100;
    if (!data.costo_mantenimiento) data.costo_mantenimiento = 5;
    if (!data.nivel_servicio)     data.nivel_servicio     = 1.65;
    if (!data.tiempo_entrega)     data.tiempo_entrega     = 1;

    const nuevo = await inventarioModel.crearInventario(data);
    res.status(201).json(nuevo);
  } catch (err) {
    console.error('[createInventario]', err);

    // Llave duplicada — variante_id ya existe en inventario
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Esta variante ya tiene un registro de inventario.',
        sugerencia: 'Usa la opción de editar en lugar de crear uno nuevo.',
        detalle: err.detail,
      });
    }

    res.status(500).json({
      error: 'Error al crear inventario',
      detalle: err.message,
    });
  }
};

// ─── PUT actualizar ───────────────────────────────────────────────────────────
const updateInventario = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.ventas_diarias !== undefined) {
      data.demanda_anual = parseFloat(data.ventas_diarias) * 365;
    }

    const actualizado = await inventarioModel.actualizarInventario(req.params.id, data);

    if (!actualizado) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    res.json(actualizado);
  } catch (err) {
    console.error('[updateInventario]', err);
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteInventario = async (req, res) => {
  try {
    // Verificar que existe antes de borrar
    const item = await inventarioModel.obtenerInventarioPorId(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    await inventarioModel.eliminarInventario(req.params.id);
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    console.error('[deleteInventario]', err);
    res.status(500).json({ error: 'Error al eliminar inventario' });
  }
};

module.exports = {
  getInventario,
  getInventarioPorId,
  createInventario,
  updateInventario,
  deleteInventario,
};