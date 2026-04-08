// controllers/admin/inventarioController.js

const inventarioModel = require('../../models/admin/inventarioModel');

// ─── Fórmulas matemáticas ────────────────────────────────────────────────────
const calcularEOQ = (D, S, H) => {
  if (!D || !S || !H || H === 0) return 0;
  return Math.sqrt((2 * D * S) / H);
};

const calcularStockSeguridad = (Z, sigma, L) => {
  if (!Z || !sigma || !L) return 0;
  return Z * sigma * Math.sqrt(L);
};

const calcularROP = (d, L, SS) => (d * L) + SS;

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

// ─── GET reabastecimiento ──────────────────────────────────────────────────────
const getReabastecimiento = async (req, res) => {
  try {
    const inventario = await inventarioModel.obtenerInventario();

    const resultado = inventario.map((item) => {
      const ventasDiarias = item.demanda_anual ? item.demanda_anual / 365 : 0;

      const D     = parseFloat(item.demanda_anual)       || 0;
      const S     = parseFloat(item.costo_pedido)        || 100;
      const H     = parseFloat(item.costo_mantenimiento) || 5;
      const L     = parseFloat(item.tiempo_entrega)      || 1;
      const Z     = parseFloat(item.nivel_servicio)      || 1.65;
      const sigma = parseFloat(item.desviacion_demanda)  || parseFloat((ventasDiarias * 0.3).toFixed(2));

      const EOQ = Math.round(calcularEOQ(D, S, H));
      const SS  = Math.round(calcularStockSeguridad(Z, sigma, L));
      const ROP = Math.round(calcularROP(ventasDiarias, L, SS));

      // Alerta si el stock actual bajó del punto de reorden
      const alerta = item.cantidad_disponible <= ROP;

      return {
        ...item,
        EOQ,
        stock_seguridad: SS,
        punto_reorden:   ROP,
        alerta,
        recomendacion: alerta
          ? `Pedir ${EOQ} unidades`
          : 'Stock suficiente',
        // Variables del modelo (útil para el frontend y para la maestra)
        _modelo: {
          D,
          S,
          H,
          Z,
          sigma: parseFloat(sigma.toFixed(2)),
          L,
          d: parseFloat(ventasDiarias.toFixed(2)),
        },
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error('[getReabastecimiento]', err);
    res.status(500).json({
      error: 'Error en reabastecimiento',
      detalle: err.message,
    });
  }
};

module.exports = {
  getInventario,
  getInventarioPorId,
  createInventario,
  updateInventario,
  deleteInventario,
  getReabastecimiento,
};