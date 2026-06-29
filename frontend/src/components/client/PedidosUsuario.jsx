// frontend/src/components/client/PedidosUsuario.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL;

// ✅ ACTUALIZADO A ESPAÑOL (coincide con tu base de datos)
const ESTADO_CONFIG = {
  // Estados del pedido
  PENDIENTE_VERIFICACION: { texto: "⏳ Anticipo pendiente", color: "#f59e0b", bg: "#fef3c7" },
  EN_DISENO:              { texto: "🎨 En diseño",          color: "#3b82f6", bg: "#eff6ff" },
  EN_REVISION:            { texto: "🔍 En revisión",        color: "#8b5cf6", bg: "#f5f3ff" },
  PREVIAS_ENVIADAS:       { texto: "👁️ Previa lista",       color: "#06b6d4", bg: "#ecfeff" },
  EN_PRODUCCION:          { texto: "🏭 En producción",      color: "#10b981", bg: "#ecfdf5" },
  PENDIENTE_PAGO_FINAL:   { texto: "💰 Pago final pendiente", color: "#f59e0b", bg: "#fef3c7" },
  VERIFICANDO_PAGO_FINAL: { texto: "🔍 Verificando pago final", color: "#8b5cf6", bg: "#f5f3ff" },
  ENVIADO:                { texto: "📦 Enviado",            color: "#16a34a", bg: "#dcfce7" },
  CANCELADO:              { texto: "❌ Cancelado",           color: "#dc2626", bg: "#fee2e2" },
  
  // Estados del pago
  PENDIENTE:  { texto: "⏳ En verificación", color: "#f59e0b", bg: "#fef3c7" },
  APROBADO:   { texto: "✅ Aprobado",        color: "#16a34a", bg: "#dcfce7" },
  RECHAZADO:  { texto: "❌ Rechazado",       color: "#dc2626", bg: "#fee2e2" }
};

function PedidosUsuario() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  const fetchPedidos = async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/client/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al cargar pedidos");
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      setError("No se pudieron cargar tus pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPedidos(); }, []);

  if (loading) return <p className="cp-loading-inline">Cargando tus compras…</p>;
  if (error)   return <div className="cp-empty-section"><span>⚠️</span><p>{error}</p></div>;

  if (pedidos.length === 0) {
    return (
      <div className="cp-empty-section">
        <span>🛒</span>
        <p>No has realizado ninguna compra aún.</p>
      </div>
    );
  }

  return (
    <div className="cp-pedidos-list">
      {pedidos.map(pedido => {
        // Obtener la configuración del estado del pedido
        const estadoInfo = ESTADO_CONFIG[pedido.estado] || { 
          texto: pedido.estado, 
          color: "#6b7280", 
          bg: "#f3f4f6" 
        };
        
        // Buscar el pago del anticipo
        const pagoAnticipo = pedido.pagos?.find(p => p.tipo_pago === 'ANTICIPO');
        const estadoPagoInfo = pagoAnticipo ? ESTADO_CONFIG[pagoAnticipo.estado_pago] : null;

        return (
          <div key={pedido.id} className="cp-pedido-card">

            {/* HEADER */}
            <div className="cp-pedido-header">
              <span className="cp-pedido-id">Pedido #{pedido.id}</span>
              <span className="cp-pedido-fecha">
                {new Date(pedido.fecha_pedido).toLocaleDateString("es-MX")}
              </span>
              <span
                className="cp-pedido-estado"
                style={{ 
                  color: estadoInfo.color, 
                  background: estadoInfo.bg, 
                  padding: "2px 10px", 
                  borderRadius: "99px", 
                  fontSize: "0.8rem" 
                }}
              >
                {estadoInfo.texto}
              </span>
            </div>

            {/* ITEMS */}
            <div className="cp-pedido-items">
              {(pedido.detalles || []).map((item, idx) => (
                <div key={idx} className="cp-pedido-item">
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt={item.producto_nombre}
                      className="cp-pedido-item-img"
                      onError={e => (e.target.src = "/placeholder.png")}
                    />
                  )}
                  <div className="cp-pedido-item-info">
                    <h4>{item.producto_nombre}</h4>
                    {item.color && <p>Color: {item.color}</p>}
                    <p>Cantidad: {item.cantidad}</p>
                    <p>Precio unitario: ${Number(item.precio_unitario).toFixed(2)}</p>
                  </div>
                  <div className="cp-pedido-item-total">
                    ${Number(item.subtotal).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER */}
            <div className="cp-pedido-footer">
              <div className="cp-pedido-totales">
                <span>Subtotal: <strong>${Number(pedido.total_productos).toFixed(2)}</strong></span>
                <span>Envío: <strong>${Number(pedido.costo_envio).toFixed(2)}</strong></span>
                <span>Total: <strong>${Number(pedido.total_general).toFixed(2)}</strong></span>
              </div>
              <div className="cp-pedido-entrega">
                📦 {pedido.metodo_entrega_nombre || "Sin método"}
              </div>
            </div>

            {/* SECCIÓN DE PAGO */}
            <div className="cp-pedido-pago-section">
              {/* Caso 1: Pedido en espera de verificación SIN pago */}
              {pedido.estado === 'PENDIENTE_VERIFICACION' && !pagoAnticipo && (
                <div className="cp-pago-pendiente">
                  <p>💳 Anticipo pendiente: <strong>${Number(pedido.monto_anticipo).toFixed(2)}</strong></p>
                  <button
                    className="cp-btn-pago"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}
                  >
                    Subir comprobante
                  </button>
                </div>
              )}

              {/* Caso 2: Pago registrado */}
              {pagoAnticipo && (
                <div className="cp-pago-registrado">
                  {pagoAnticipo.estado_pago === 'PENDIENTE' && (
                    <p>🕐 Comprobante enviado, esperando verificación del administrador.</p>
                  )}
                  {pagoAnticipo.estado_pago === 'APROBADO' && (
                    <p>✅ Anticipo verificado y aprobado.</p>
                  )}
                  {pagoAnticipo.estado_pago === 'RECHAZADO' && (
                    <div>
                      <p>❌ Comprobante rechazado. {pagoAnticipo.notas_admin && `Motivo: ${pagoAnticipo.notas_admin}`}</p>
                      <button
                        className="cp-btn-pago"
                        onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}
                      >
                        Subir nuevo comprobante
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Caso 3: Pedido en diseño (después de pago aprobado) */}
              {pedido.estado === 'EN_DISENO' && (
                <div className="cp-pago-registrado">
                  <p>🎨 Tu pedido está en etapa de diseño. ¡Sube tu diseño personalizado!</p>
                  <button
                    className="cp-btn-diseno"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/diseno`)}
                  >
                    Subir diseño
                  </button>
                </div>
              )}

              {/* Caso 4: Pedido en espera de pago final */}
              {pedido.estado === 'PENDIENTE_PAGO_FINAL' && (
                <div className="cp-pago-pendiente">
                  <p>💰 Pago final pendiente: <strong>${Number(pedido.monto_restante).toFixed(2)}</strong></p>
                  <button
                    className="cp-btn-pago"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}
                  >
                    Pagar saldo restante
                  </button>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}

export default PedidosUsuario;