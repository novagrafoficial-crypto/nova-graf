// frontend/src/components/client/PedidosUsuario.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";
import "../../styles/client/PedidosUsuario.css";

const API_BASE = import.meta.env.VITE_API_URL;

// ✅ ESTADOS DEL PEDIDO
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

  // Estados del pago
  PENDIENTE: { texto: "⏳ En verificación", color: "#f59e0b", bg: "#fef3c7" },
  APROBADO: { texto: "✅ Aprobado", color: "#16a34a", bg: "#dcfce7" },
  RECHAZADO: { texto: "❌ Rechazado", color: "#dc2626", bg: "#fee2e2" }
};

// ─── MODAL DE CONFIRMACIÓN ──────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;

  return (
    <div className="ped-modal-overlay" onClick={onCancelar}>
      <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ped-modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="ped-modal-titulo">Confirmar acción</h2>
        <p className="ped-modal-mensaje">{mensaje}</p>
        <div className="ped-modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción no se puede deshacer.</span>
        </div>
        <div className="ped-modal-botones">
          <button className="ped-modal-btn ped-modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="ped-modal-btn ped-modal-btn--confirmar" onClick={onConfirmar}>
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL DE NOTIFICACIÓN ──────────────────────────────────────
const ModalNotificacion = ({ visible, tipo, titulo, mensaje, onCerrar }) => {
  if (!visible) return null;

  const esExito = tipo === 'exito';
  const icono = esExito ? '✅' : '❌';
  const fondoIcono = esExito ? '#dcfce7' : '#fee2e2';

  return (
    <div className="ped-modal-overlay" onClick={onCerrar}>
      <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ped-modal-icon" style={{ background: fondoIcono }}>
          <span style={{ fontSize: '28px' }}>{icono}</span>
        </div>
        <h2 className="ped-modal-titulo">{titulo}</h2>
        <p className="ped-modal-mensaje">{mensaje}</p>
        <div className="ped-modal-aviso">
          <span>ℹ️</span>
          <span>{esExito ? 'La acción se completó correctamente.' : 'Por favor, intenta de nuevo.'}</span>
        </div>
        <button className="ped-modal-boton" onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

function PedidosUsuario() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Estados para modales
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    pedidoId: null,
    mensaje: ''
  });
  const [notifModal, setNotifModal] = useState({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: ''
  });

  const mostrarConfirmacion = (pedidoId, mensaje) => {
    setConfirmModal({ visible: true, pedidoId, mensaje });
  };

  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, pedidoId: null, mensaje: '' });
  };

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };

  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  // ─── OBTENER PEDIDOS ──────────────────────────────────────────
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

  // ─── CANCELAR PEDIDO ──────────────────────────────────────────
  const handleCancelarPedido = async () => {
    const { pedidoId } = confirmModal;
    cerrarConfirmacion();

    try {
      const token = getToken();
      if (!token) {
        mostrarNotificacion('error', 'Sesión no iniciada', 'Debes iniciar sesión para cancelar pedidos.');
        return;
      }

      const res = await fetch(`${API_BASE}/api/client/pedidos/${pedidoId}/cancelar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al cancelar pedido');

      mostrarNotificacion('exito', 'Pedido cancelado', 'El pedido ha sido cancelado exitosamente.');
      await fetchPedidos();
    } catch (err) {
      console.error(err);
      mostrarNotificacion('error', 'Error', 'No se pudo cancelar el pedido. Intenta de nuevo.');
    }
  };

  // ─── ELIMINAR PEDIDO ──────────────────────────────────────────
  const handleEliminarPedido = async (pedidoId) => {
    try {
      const token = getToken();
      if (!token) {
        mostrarNotificacion('error', 'Sesión no iniciada', 'Debes iniciar sesión para eliminar pedidos.');
        return;
      }

      const res = await fetch(`${API_BASE}/api/client/pedidos/${pedidoId}/eliminar`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar pedido');

      mostrarNotificacion('exito', 'Pedido eliminado', 'El pedido ha sido eliminado exitosamente.');
      await fetchPedidos();
    } catch (err) {
      console.error(err);
      mostrarNotificacion('error', 'Error', 'No se pudo eliminar el pedido. Intenta de nuevo.');
    }
  };

  useEffect(() => { fetchPedidos(); }, []);

  if (loading) return <p className="cp-loading-inline">Cargando tus compras…</p>;
  if (error) return <div className="cp-empty-section"><span>⚠️</span><p>{error}</p></div>;

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
      {/* Modales */}
      <ModalConfirmacion
        visible={confirmModal.visible}
        mensaje={confirmModal.mensaje}
        onConfirmar={handleCancelarPedido}
        onCancelar={cerrarConfirmacion}
      />
      <ModalNotificacion
        visible={notifModal.visible}
        tipo={notifModal.tipo}
        titulo={notifModal.titulo}
        mensaje={notifModal.mensaje}
        onCerrar={cerrarNotificacion}
      />

      {pedidos.map(pedido => {
        const estadoInfo = ESTADO_CONFIG[pedido.estado] || {
          texto: pedido.estado,
          color: "#6b7280",
          bg: "#f3f4f6"
        };

        const pagoAnticipo = pedido.pagos?.find(p => p.tipo_pago === 'ANTICIPO');
        const pagoFinal = pedido.pagos?.find(p => p.tipo_pago === 'SALDO_FINAL');

        const puedeCancelar = ['PENDIENTE_VERIFICACION', 'EN_DISENO', 'EN_REVISION'].includes(pedido.estado);
        const puedeEliminar = ['CANCELADO', 'ENVIADO'].includes(pedido.estado);

        return (
          <div key={pedido.id} className="cp-pedido-card">
            {/* ─── HEADER ─── */}
            <div className="cp-pedido-header">
              <div className="cp-pedido-info-left">
                <span className="cp-pedido-id">Pedido #{pedido.id}</span>
                <span className="cp-pedido-fecha">
                  {new Date(pedido.fecha_pedido).toLocaleDateString("es-MX")}
                </span>
              </div>
              <div className="cp-pedido-info-right">
                <span
                  className="cp-pedido-estado"
                  style={{
                    color: estadoInfo.color,
                    background: estadoInfo.bg,
                    padding: "4px 14px",
                    borderRadius: "99px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}
                >
                  {estadoInfo.texto}
                </span>
                <button
                  className="cp-btn-detalle"
                  onClick={() => navigate(`/cliente/pedido/${pedido.id}`)}
                  title="Ver detalle del pedido"
                >
                  👁️ Ver detalle
                </button>
                {puedeCancelar && (
                  <button
                    className="cp-btn-cancelar"
                    onClick={() => mostrarConfirmacion(pedido.id, `¿Estás seguro de cancelar el pedido #${pedido.id}?`)}
                    title="Cancelar pedido"
                  >
                    ❌ Cancelar
                  </button>
                )}
                {puedeEliminar && (
                  <button
                    className="cp-btn-eliminar"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el pedido #${pedido.id}?`)) {
                        handleEliminarPedido(pedido.id);
                      }
                    }}
                    title="Eliminar pedido"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* ─── ITEMS ─── */}
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

            {/* ─── FOOTER ─── */}
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

            {/* ─── SECCIÓN DE PAGO ─── */}
            <div className="cp-pedido-pago-section">
              {pedido.estado === 'PENDIENTE_VERIFICACION' && !pagoAnticipo && (
                <div className="cp-pago-pendiente">
                  <p>💳 Anticipo pendiente: <strong>${Number(pedido.monto_anticipo).toFixed(2)}</strong></p>
                  <button
                    className="cp-btn-pago"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}
                  >
                    📎 Subir comprobante
                  </button>
                </div>
              )}

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
                        📎 Subir nuevo comprobante
                      </button>
                    </div>
                  )}
                </div>
              )}

              {pedido.estado === 'EN_DISENO' && (
                <div className="cp-pago-registrado">
                  <p>🎨 Tu pedido está en etapa de diseño. ¡Sube tu diseño personalizado!</p>
                  <button
                    className="cp-btn-diseno"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/diseno`)}
                  >
                    🎨 Subir diseño
                  </button>
                </div>
              )}

              {pedido.estado === 'PENDIENTE_PAGO_FINAL' && !pagoFinal && (
                <div className="cp-pago-pendiente">
                  <p>💰 Pago final pendiente: <strong>${Number(pedido.monto_restante).toFixed(2)}</strong></p>
                  <button
                    className="cp-btn-pago"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}
                  >
                    💳 Pagar saldo restante
                  </button>
                </div>
              )}

              {pagoFinal && (
                <div className="cp-pago-registrado">
                  {pagoFinal.estado_pago === 'PENDIENTE' && (
                    <p>🕐 Pago final en verificación.</p>
                  )}
                  {pagoFinal.estado_pago === 'APROBADO' && (
                    <p>✅ Pago final aprobado. ¡Pronto recibirás tu pedido!</p>
                  )}
                  {pagoFinal.estado_pago === 'RECHAZADO' && (
                    <div>
                      <p>❌ Pago final rechazado. {pagoFinal.notas_admin && `Motivo: ${pagoFinal.notas_admin}`}</p>
                      <button
                        className="cp-btn-pago"
                        onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}
                      >
                        📎 Subir nuevo comprobante
                      </button>
                    </div>
                  )}
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