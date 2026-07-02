// src/pages/Client/DetallePedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/DetallePedido.css';

// ✅ Estados del pedido (igual que en PedidosUsuario)
const ESTADO_CONFIG = {
  PENDIENTE_VERIFICACION: { texto: "⏳ Anticipo pendiente", color: "#f59e0b", bg: "#fef3c7" },
  EN_DISENO: { texto: "🎨 En diseño", color: "#3b82f6", bg: "#eff6ff" },
  EN_REVISION: { texto: "🔍 En revisión", color: "#8b5cf6", bg: "#f5f3ff" },
  PREVIAS_ENVIADAS: { texto: "👁️ Previa lista", color: "#06b6d4", bg: "#ecfeff" },
  EN_PRODUCCION: { texto: "🏭 En producción", color: "#10b981", bg: "#ecfdf5" },
  PENDIENTE_PAGO_FINAL: { texto: "💰 Pago final pendiente", color: "#f59e0b", bg: "#fef3c7" },
  VERIFICANDO_PAGO_FINAL: { texto: "🔍 Verificando pago final", color: "#8b5cf6", bg: "#f5f3ff" },
  ENVIADO: { texto: "📦 Enviado", color: "#16a34a", bg: "#dcfce7" },
  CANCELADO: { texto: "❌ Cancelado", color: "#dc2626", bg: "#fee2e2" },
};

const DetallePedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPedido = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/client/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedido(res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  if (loading) return <div className="detalle-loading">Cargando...</div>;
  if (error) return <div className="detalle-error">{error}</div>;
  if (!pedido) return <div className="detalle-error">Pedido no encontrado</div>;

  const estadoInfo = ESTADO_CONFIG[pedido.estado] || { texto: pedido.estado, color: "#6b7280", bg: "#f3f4f6" };

  return (
    <div className="detalle-pedido-wrapper">
      {/* ─── HEADER ─── */}
      <div className="detalle-pedido-header">
        <button onClick={() => navigate('/cliente/pedidos')} className="btn-volver">
          ← Volver a mis pedidos
        </button>
        <div className="detalle-pedido-titulo">
          <h2>Pedido #{pedido.id}</h2>
          <span
            className="detalle-estado"
            style={{ color: estadoInfo.color, background: estadoInfo.bg }}
          >
            {estadoInfo.texto}
          </span>
        </div>
      </div>

      {/* ─── GRID ─── */}
      <div className="detalle-pedido-grid">
        {/* Información */}
        <div className="detalle-info">
          <h3>📋 Información del pedido</h3>
          <div className="info-linea">
            <span>Fecha:</span>
            <span>{new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
          </div>
          <div className="info-linea">
            <span>Método de entrega:</span>
            <span>{pedido.metodo_entrega_nombre}</span>
          </div>
          <div className="info-linea">
            <span>Dirección:</span>
            <span>{pedido.direccion_envio || 'No especificada'}</span>
          </div>
          {pedido.distancia_km_calculada && (
            <div className="info-linea">
              <span>Distancia:</span>
              <span>{pedido.distancia_km_calculada} km</span>
            </div>
          )}
          <div className="info-linea">
            <span>Fecha estimada:</span>
            <span>{pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleDateString() : 'Por definir'}</span>
          </div>
          <div className="info-linea total">
            <span>Total:</span>
            <span>${pedido.total_general}</span>
          </div>
        </div>

        {/* Productos */}
        <div className="detalle-productos">
          <h3>🛒 Productos</h3>
          {pedido.detalles?.map((detalle, index) => (
            <div key={index} className="producto-item">
              <img 
                src={detalle.imagen_url || '/placeholder.png'} 
                alt={detalle.producto_nombre} 
                onError={(e) => (e.target.src = '/placeholder.png')}
              />
              <div className="producto-info">
                <h4>{detalle.producto_nombre}</h4>
                <p>Color: {detalle.color || 'N/A'}</p>
                <p>Cantidad: {detalle.cantidad}</p>
                <p>Precio unitario: ${detalle.precio_unitario}</p>
              </div>
              <div className="producto-precio">
                ${detalle.subtotal}
              </div>
            </div>
          ))}
          <div className="producto-total">
            <span>Subtotal productos:</span>
            <span>${pedido.total_productos}</span>
          </div>
          <div className="producto-total">
            <span>Envío:</span>
            <span>${pedido.costo_envio}</span>
          </div>
          <div className="producto-total grand-total">
            <span>Total:</span>
            <span>${pedido.total_general}</span>
          </div>
        </div>
      </div>

      {/* ─── PAGOS ─── */}
      <div className="detalle-pagos">
        <h3>💳 Pagos</h3>
        {pedido.pagos?.length > 0 ? (
          pedido.pagos.map((pago, index) => (
            <div key={index} className="pago-item">
              <span className="pago-tipo">{pago.tipo_pago}</span>
              <span className="pago-monto">${pago.monto}</span>
              <span className={`pago-estado ${pago.estado_pago.toLowerCase()}`}>
                {pago.estado_pago === 'PENDIENTE' ? '⏳ En verificación' :
                 pago.estado_pago === 'APROBADO' ? '✅ Aprobado' :
                 pago.estado_pago === 'RECHAZADO' ? '❌ Rechazado' : pago.estado_pago}
              </span>
              {pago.comprobante_url && (
                <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer" className="pago-comprobante">
                  📎 Ver comprobante
                </a>
              )}
              {pago.notas_admin && (
                <span className="pago-notas">📝 {pago.notas_admin}</span>
              )}
            </div>
          ))
        ) : (
          <p className="pago-vacio">No hay pagos registrados</p>
        )}
      </div>

      {/* ─── ACCIONES ─── */}
      <div className="detalle-acciones">
        {pedido.estado === 'PENDIENTE_VERIFICACION' && (
          <button className="btn-accion btn-pago" onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}>
            📎 Subir comprobante de pago
          </button>
        )}
        {pedido.estado === 'EN_DISENO' && (
          <button className="btn-accion btn-diseno" onClick={() => navigate(`/cliente/pedido/${pedido.id}/diseno`)}>
            🎨 Subir diseño personalizado
          </button>
        )}
        {pedido.estado === 'PENDIENTE_PAGO_FINAL' && (
          <button className="btn-accion btn-pago" onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}>
            💰 Pagar saldo restante
          </button>
        )}
      </div>
    </div>
  );
};

export default DetallePedido;