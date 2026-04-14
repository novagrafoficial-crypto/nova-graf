// frontend/src/components/client/PedidosUsuario.jsx
import { useState, useEffect } from "react";
import { getToken } from "../../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL;

const ENTREGA_LABEL = {
  domicilio:      "🚚 Domicilio",
  punto_entrega:  "📦 Punto de entrega",
};
const PAGO_LABEL = {
  tarjeta:        "💳 Tarjeta",
  transferencia:  "🏦 Transferencia",
};

// ─── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="modal-titulo">Cancelar pedido</h2>
        <p className="modal-mensaje">{mensaje}</p>
        <div className="modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción no se puede deshacer.</span>
        </div>
        <div className="modal-botones">
          <button className="modal-btn modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="modal-btn modal-btn--confirmar" onClick={onConfirmar}>
            Sí, cancelar pedido
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL DE NOTIFICACIÓN ─────────────────────────────────────────
const ModalNotificacion = ({ visible, tipo, titulo, mensaje, onCerrar }) => {
  if (!visible) return null;
  const esExito = tipo === 'exito';
  const icono = esExito ? '✅' : '❌';
  const fondoIcono = esExito ? '#dcfce7' : '#fee2e2';
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ background: fondoIcono }}>
          <span style={{ fontSize: '28px' }}>{icono}</span>
        </div>
        <h2 className="modal-titulo">{titulo}</h2>
        <p className="modal-mensaje">{mensaje}</p>
        <div className="modal-aviso">
          <span>ℹ️</span>
          <span>{esExito ? 'La acción se completó correctamente.' : 'Por favor, intenta de nuevo.'}</span>
        </div>
        <button className="modal-boton-unico" onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

function PedidosUsuario() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [confirmModal, setConfirmModal] = useState({ visible: false, pedidoId: null, mensaje: "" });
  const [notifModal, setNotifModal] = useState({ visible: false, tipo: "exito", titulo: "", mensaje: "" });

  const mostrarConfirmacion = (pedidoId, mensaje) => {
    setConfirmModal({ visible: true, pedidoId, mensaje });
  };
  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, pedidoId: null, mensaje: "" });
  };
  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };
  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  const fetchPedidos = async () => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/api/client/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
        setLoading(false);
        return;
      }
    } catch {
      console.warn("Backend no disponible, usando datos locales");
    }
    // Fallback a pedidos simulados en localStorage
    const stored = localStorage.getItem("pedidos_simulados");
    const simulados = stored ? JSON.parse(stored) : [];
    simulados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    setPedidos(simulados);
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleCancelarPedido = async () => {
    const { pedidoId } = confirmModal;
    cerrarConfirmacion();

    // Simulación local (si no hay backend real)
    try {
      // Aquí puedes llamar al endpoint real cuando exista:
      // await fetch(`${API_BASE}/api/client/pedidos/${pedidoId}/cancelar`, { method: 'PUT', headers: { Authorization: `Bearer ${getToken()}` } });

      // Actualización local del estado
      setPedidos(prev =>
        prev.map(p => p.id === pedidoId ? { ...p, estado: "Cancelado" } : p)
      );
      mostrarNotificacion("exito", "Pedido cancelado", "El pedido ha sido cancelado exitosamente.");
    } catch {
      mostrarNotificacion("error", "Error", "No se pudo cancelar el pedido. Intenta de nuevo.");
    }
  };

  if (loading) return <p className="cp-loading-inline">Cargando tus compras…</p>;

  if (pedidos.length === 0) {
    return (
      <div className="cp-empty-section">
        <span>🛒</span>
        <p>No has realizado ninguna compra aún.</p>
      </div>
    );
  }

  return (
    <>
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

      <div className="cp-pedidos-list">
        {pedidos.map(pedido => (
          <div key={pedido.id} className="cp-pedido-card">
            <div className="cp-pedido-header">
              <span className="cp-pedido-id">Pedido #{pedido.id}</span>
              <span className="cp-pedido-fecha">
                {new Date(pedido.fecha).toLocaleDateString("es-MX")}
              </span>
              <span className={`cp-pedido-estado cp-pedido-estado--${(pedido.estado || "completado").toLowerCase()}`}>
                {pedido.estado || "Completado"}
              </span>
              {pedido.estado !== "Cancelado" && (
                <button
                  className="cp-btn cp-btn--small cp-btn--danger"
                  onClick={() => mostrarConfirmacion(pedido.id, `¿Cancelar el pedido #${pedido.id}?`)}
                >
                  Cancelar pedido
                </button>
              )}
            </div>

            <div className="cp-pedido-items">
              {pedido.items.map((item, idx) => (
                <div key={idx} className="cp-pedido-item">
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className="cp-pedido-item-img"
                    onError={e => (e.target.src = "/placeholder.png")}
                  />
                  <div className="cp-pedido-item-info">
                    <h4>{item.nombre}</h4>
                    <p>Cantidad: {item.cantidad}</p>
                    <p>Precio unitario: ${Number(item.precio_unitario).toFixed(2)}</p>
                    {item.texto_personalizado && (
                      <p className="cp-pedido-item-texto">Texto: {item.texto_personalizado}</p>
                    )}
                  </div>
                  <div className="cp-pedido-item-total">
                    ${(item.cantidad * Number(item.precio_unitario)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cp-pedido-footer">
              <div className="cp-pedido-total">
                Total: <strong>${Number(pedido.total).toFixed(2)}</strong>
              </div>
              <div className="cp-pedido-entrega">
                {ENTREGA_LABEL[pedido.forma_entrega] || "🏬 Retiro en tienda"}
              </div>
              <div className="cp-pedido-pago">
                {PAGO_LABEL[pedido.forma_pago] || "💰 Depósito"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default PedidosUsuario;