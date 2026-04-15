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

// ─── MODAL DE NOTIFICACIÓN (solo para mensajes informativos) ────────────
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

  // Estado para modal de notificación (ya no hay confirmación de cancelación)
  const [notifModal, setNotifModal] = useState({ visible: false, tipo: "exito", titulo: "", mensaje: "" });

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
              {/* Botón de cancelar eliminado */}
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