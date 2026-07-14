// backend/controllers/alexa/pedidosController.js
const PedidosModel = require('../../models/alexa/pedidosModel');

const LOGO_URL = 'https://dobgpjhgmenqysikaete.supabase.co/storage/v1/object/public/portafolio/NOVA.png';

// ─── FORMATEADORES PARA ALEXA ───────────────────────────
// OJO: pool.query (pg) devuelve columnas PLANAS (pedido.nombre,
// pedido.correo_electronico...), NO objetos anidados como Supabase JS
// (pedido.usuarios.nombre). Por eso se leen directo del row.

const nombreCompleto = (row) => {
    const partes = [row.nombre, row.apellido_paterno, row.apellido_materno]
        .filter(p => p && p.trim().length > 0);
    return partes.length > 0 ? partes.join(' ') : 'Cliente';
};

// Formateo para lista (resumen) — ahora incluye imagen
const formatearPedidoLista = (pedido) => {
    return {
        id: pedido.id,
        cliente: nombreCompleto(pedido),
        fecha: new Date(pedido.fecha_pedido).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }),
        total: `$${Number(pedido.total_general).toFixed(2)}`,
        estado: (pedido.estado || '').replace(/_/g, ' '),
        estadoOriginal: pedido.estado,
        anticipo: `$${Number(pedido.monto_anticipo || 0).toFixed(2)}`,
        restante: `$${Number(pedido.monto_restante || 0).toFixed(2)}`,
        estadoCorto: pedido.estado,
        colorEstado: getColorEstado(pedido.estado),
        imagen: pedido.imagen || LOGO_URL
    };
};

// Formateo para detalle completo — lee campos planos de d y de pedido
const formatearDetalleCompleto = (data) => {
    const { pedido, detalles, pagos } = data;

    return {
        // Información básica
        id: pedido.id,
        fecha: new Date(pedido.fecha_pedido).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }),
        fechaCompleta: new Date(pedido.fecha_pedido).toLocaleString('es-MX'),

        // Cliente
        cliente: nombreCompleto(pedido),
        correo: pedido.correo_electronico || 'Sin correo',
        telefono: pedido.telefono || 'Sin teléfono',
        domicilio: pedido.domicilio || 'Sin domicilio registrado',

        // Económico
        total: `$${Number(pedido.total_general).toFixed(2)}`,
        anticipo: `$${Number(pedido.monto_anticipo || 0).toFixed(2)}`,
        restante: `$${Number(pedido.monto_restante || 0).toFixed(2)}`,
        totalProductos: `$${Number(pedido.total_productos || 0).toFixed(2)}`,
        costoEnvio: `$${Number(pedido.costo_envio || 0).toFixed(2)}`,

        // Estado
        estado: (pedido.estado || '').replace(/_/g, ' '),
        estadoOriginal: pedido.estado,
        colorEstado: getColorEstado(pedido.estado),

        // Entrega
        direccion: pedido.direccion_envio || 'No especificada',
        metodoEntrega: pedido.metodo_entrega || 'No especificado',
        descripcionEntrega: pedido.descripcion_entrega || '',
        distanciaKm: pedido.distancia_km_calculada || 0,
        codigoRastreo: pedido.codigo_rastreo || 'Sin código',
        fechaEntregaEstimada: pedido.fecha_entrega_estimada ?
            new Date(pedido.fecha_entrega_estimada).toLocaleDateString('es-MX') :
            'No estimada',

        // Pago
        metodoPago: pedido.metodo_pago || 'No especificado',
        tipoPago: pedido.tipo_pago || '',
        instruccionesPago: pedido.instrucciones_pago || '',

        // Productos — campos planos: producto_nombre, producto_descripcion,
        // categoria_nombre, imagen_url, sku (así los nombró el JOIN en el modelo)
        productos: detalles.map(d => ({
            nombre: d.producto_nombre || 'Producto',
            descripcion: d.producto_descripcion || '',
            categoria: d.categoria_nombre || 'Sin categoría',
            cantidad: d.cantidad,
            precio: `$${Number(d.precio_unitario).toFixed(2)}`,
            subtotal: `$${Number(d.cantidad * d.precio_unitario).toFixed(2)}`,
            imagen: d.imagen_url || null, // null real = falta subir imagen a esa variante
            sku: d.sku || ''
        })),
        totalProductosCount: detalles.length,

        // Pagos realizados
        pagos: pagos.map(p => ({
            tipo: p.tipo_pago,
            monto: `$${Number(p.monto).toFixed(2)}`,
            estado: p.estado_pago,
            fecha: p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : 'Sin fecha',
            comprobante: p.comprobante_url || null,
            notas: p.notas_admin || ''
        })),
        totalPagos: pagos.length
    };
};

// Colores para estados en pantalla (los mismos que ya tenías)
function getColorEstado(estado) {
    const colores = {
        'PENDIENTE_VERIFICACION': '#F59E0B',
        'EN_DISENO': '#3B82F6',
        'EN_REVISION': '#EC4899',
        'PREVIAS_ENVIADAS': '#8B5CF6',
        'EN_PRODUCCION': '#10B981',
        'PENDIENTE_PAGO_FINAL': '#EF4444',
        'ENVIADO': '#06B6D4',
        'CANCELADO': '#6B7280'
    };
    return colores[estado] || '#6B7280';
}

// ─── CONTROLADORES ────────────────────────────────────────

// OBTENER TODOS
exports.obtenerPedidos = async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const pedidos = await PedidosModel.obtenerTodos(parseInt(limit));
        res.json(pedidos.map(formatearPedidoLista));
    } catch (error) {
        console.error('❌ Error en obtenerPedidos:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER POR ESTADO
exports.obtenerPorEstado = async (req, res) => {
    try {
        const { estado } = req.params;
        const pedidos = await PedidosModel.obtenerPorEstado(estado);
        res.json(pedidos.map(formatearPedidoLista));
    } catch (error) {
        console.error('❌ Error en obtenerPorEstado:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER POR CLIENTE
exports.obtenerPorCliente = async (req, res) => {
    try {
        const { nombre } = req.params;
        const pedidos = await PedidosModel.obtenerPorCliente(nombre);
        res.json(pedidos.map(formatearPedidoLista));
    } catch (error) {
        console.error('❌ Error en obtenerPorCliente:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER POR FECHA
exports.obtenerPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const pedidos = await PedidosModel.obtenerPorFecha(fecha);
        res.json(pedidos.map(formatearPedidoLista));
    } catch (error) {
        console.error('❌ Error en obtenerPorFecha:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER DETALLE COMPLETO
exports.obtenerDetalleCompleto = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await PedidosModel.obtenerDetalleCompleto(parseInt(id));

        if (!data || !data.pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(formatearDetalleCompleto(data));
    } catch (error) {
        console.error('❌ Error en obtenerDetalleCompleto:', error);
        res.status(500).json({ error: error.message });
    }
};

// ACTUALIZAR ESTADO
exports.actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({ error: 'Estado es requerido' });
        }

        const pedidoActualizado = await PedidosModel.actualizarEstado(parseInt(id), estado);
        if (!pedidoActualizado) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({
            mensaje: `✅ Pedido ${id} actualizado a "${estado.replace(/_/g, ' ')}"`,
            pedido: pedidoActualizado
        });
    } catch (error) {
        console.error('❌ Error en actualizarEstado:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER ESTADÍSTICAS
// (antes contaba FILAS en vez de sumar "cantidad", lo que daba un total
// incorrecto si había pocos estados distintos; ya usa el cantidad real)
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const filas = await PedidosModel.obtenerEstadisticas(); // [{estado, cantidad}]
        const total = filas.reduce((suma, f) => suma + parseInt(f.cantidad), 0);

        const statsOrdenadas = filas
            .map(f => ({
                estado: (f.estado || '').replace(/_/g, ' '),
                estadoOriginal: f.estado,
                cantidad: parseInt(f.cantidad),
                color: getColorEstado(f.estado)
            }))
            .sort((a, b) => b.cantidad - a.cantidad);

        res.json({
            total,
            porEstado: statsOrdenadas,
            resumen: `📊 ${total} pedidos en total`
        });
    } catch (error) {
        console.error('❌ Error en obtenerEstadisticas:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER ÚLTIMOS PENDIENTES
exports.obtenerUltimosPendientes = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const pedidos = await PedidosModel.obtenerUltimosPorEstado(
            'PENDIENTE_VERIFICACION',
            parseInt(limit)
        );
        res.json(pedidos.map(formatearPedidoLista));
    } catch (error) {
        console.error('❌ Error en obtenerUltimosPendientes:', error);
        res.status(500).json({ error: error.message });
    }
};

// PING (Prueba de conexión)
exports.ping = async (req, res) => {
    res.json({
        status: 'ok',
        mensaje: '✅ API de Alexa para Nova Graf funcionando',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
};