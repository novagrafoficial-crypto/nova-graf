// backend/controllers/alexa/pedidosController.js
const PedidosModel = require('../../models/alexa/pedidosModel');

// ─── FORMATEADORES PARA ALEXA ───────────────────────────

// Formateo para lista (resumen)
const formatearPedidoLista = (pedido) => {
    const usuario = pedido.usuarios || {};
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();
    
    return {
        id: pedido.id,
        cliente: nombreCompleto || 'Cliente',
        fecha: new Date(pedido.fecha_pedido).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }),
        total: `$${Number(pedido.total_general).toFixed(2)}`,
        estado: pedido.estado.replace(/_/g, ' '),
        estadoOriginal: pedido.estado,
        anticipo: `$${Number(pedido.monto_anticipo || 0).toFixed(2)}`,
        restante: `$${Number(pedido.monto_restante || 0).toFixed(2)}`,
        // Para mostrar en la lista
        estadoCorto: pedido.estado,
        colorEstado: getColorEstado(pedido.estado)
    };
};

// Formateo para detalle completo
const formatearDetalleCompleto = (data) => {
    const { pedido, detalles, pagos } = data;
    const usuario = pedido.usuarios || {};
    const metodoEntrega = pedido.metodos_entrega || {};
    const metodoPago = pedido.metodos_pago || {};
    
    const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido_paterno || ''} ${usuario.apellido_materno || ''}`.trim();

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
        cliente: nombreCompleto || 'Cliente',
        correo: usuario.correo_electronico || 'Sin correo',
        telefono: usuario.telefono || 'Sin teléfono',
        domicilio: usuario.domicilio || 'Sin domicilio registrado',
        
        // Económico
        total: `$${Number(pedido.total_general).toFixed(2)}`,
        anticipo: `$${Number(pedido.monto_anticipo || 0).toFixed(2)}`,
        restante: `$${Number(pedido.monto_restante || 0).toFixed(2)}`,
        totalProductos: `$${Number(pedido.total_productos || 0).toFixed(2)}`,
        costoEnvio: `$${Number(pedido.costo_envio || 0).toFixed(2)}`,
        
        // Estado
        estado: pedido.estado.replace(/_/g, ' '),
        estadoOriginal: pedido.estado,
        colorEstado: getColorEstado(pedido.estado),
        
        // Entrega
        direccion: pedido.direccion_envio || 'No especificada',
        metodoEntrega: metodoEntrega.nombre || 'No especificado',
        descripcionEntrega: metodoEntrega.descripcion || '',
        distanciaKm: pedido.distancia_km_calculada || 0,
        codigoRastreo: pedido.codigo_rastreo || 'Sin código',
        fechaEntregaEstimada: pedido.fecha_entrega_estimada ? 
            new Date(pedido.fecha_entrega_estimada).toLocaleDateString('es-MX') : 
            'No estimada',
        
        // Pago
        metodoPago: metodoPago.nombre || 'No especificado',
        tipoPago: metodoPago.tipo || '',
        instruccionesPago: metodoPago.instrucciones || '',
        
        // Productos
        productos: detalles.map(d => {
            const variante = d.producto_variantes || {};
            const producto = variante.productos || {};
            return {
                nombre: producto.nombre || 'Producto',
                descripcion: producto.descripcion || '',
                categoria: producto.categorias?.nombre || 'Sin categoría',
                cantidad: d.cantidad,
                precio: `$${Number(d.precio_unitario).toFixed(2)}`,
                subtotal: `$${Number(d.cantidad * d.precio_unitario).toFixed(2)}`,
                imagen: variante.imagen_url || null,
                sku: variante.sku || ''
            };
        }),
        totalProductosCount: detalles.length,
        
        // Pagos realizados
        pagos: pagos.map(p => ({
            tipo: p.tipo_pago,
            monto: `$${Number(p.monto).toFixed(2)}`,
            estado: p.estado_pago,
            fecha: new Date(p.fecha_pago).toLocaleDateString('es-MX'),
            comprobante: p.comprobante_url || null,
            notas: p.notas_admin || ''
        })),
        totalPagos: pagos.length
    };
};

// Colores para estados en pantalla
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
            pedido: formatearPedidoLista(pedidoActualizado)
        });
    } catch (error) {
        console.error('❌ Error en actualizarEstado:', error);
        res.status(500).json({ error: error.message });
    }
};

// OBTENER ESTADÍSTICAS
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const pedidos = await PedidosModel.obtenerEstadisticas();
        
        const stats = {};
        pedidos.forEach(p => {
            stats[p.estado] = (stats[p.estado] || 0) + 1;
        });

        // Ordenar por cantidad
        const statsOrdenadas = Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .map(([estado, cantidad]) => ({
                estado: estado.replace(/_/g, ' '),
                estadoOriginal: estado,
                cantidad,
                color: getColorEstado(estado)
            }));

        res.json({
            total: pedidos.length,
            porEstado: statsOrdenadas,
            resumen: `📊 ${pedidos.length} pedidos en total`
        });
    } catch (error) {
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