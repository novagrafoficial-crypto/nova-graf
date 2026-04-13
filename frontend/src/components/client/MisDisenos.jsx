// frontend/src/components/client/MisDisenos.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../../utils/auth";

const API_BASE = import.meta.env.VITE_API_URL;

// ─── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="modal-titulo">Confirmar acción</h2>
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
            Sí, eliminar
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

function MisDisenos() {
  const [disenos, setDisenos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const navigate = useNavigate();

  // Estados para modales
  const [confirmModal, setConfirmModal] = useState({ visible: false, disenoId: null, mensaje: "" });
  const [notifModal, setNotifModal] = useState({ visible: false, tipo: "exito", titulo: "", mensaje: "" });

  const mostrarConfirmacion = (disenoId, mensaje) => {
    setConfirmModal({ visible: true, disenoId, mensaje });
  };
  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, disenoId: null, mensaje: "" });
  };
  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };
  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  const fetchDisenos = async () => {
    try {
      const token = getToken();
      if (!token) { setError("No has iniciado sesión"); return; }
      const res = await axios.get(`${API_BASE}/api/client/borradores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisenos(res.data);
    } catch {
      setError("No se pudieron cargar tus diseños");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisenos(); }, []);

  const handleEliminar = async () => {
    const { disenoId } = confirmModal;
    cerrarConfirmacion();
    const token = getToken();
    try {
      await axios.delete(`${API_BASE}/api/client/borradores/${disenoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisenos(prev => prev.filter(d => d.id !== disenoId));
      mostrarNotificacion("exito", "Diseño eliminado", "El diseño se ha eliminado correctamente.");
    } catch {
      mostrarNotificacion("error", "Error", "No se pudo eliminar el diseño. Intenta de nuevo.");
    }
  };

  const handleEditar = (diseno) => {
    navigate(`/cliente/producto/${diseno.producto_id}/personalizar`, {
      state: {
        imagenProducto:    diseno.variante_imagen || "",
        productoId:        diseno.producto_id,
        variante:          { id: diseno.variante_id, imagen_url: diseno.variante_imagen, color: diseno.variante_color },
        borradorId:        diseno.id,
        elementosGuardados: diseno.elementos,
      },
    });
  };

  const handleAgregarAlCarrito = async (diseno) => {
    const token = getToken();
    if (!token) {
      mostrarNotificacion("error", "Sesión no iniciada", "Debes iniciar sesión para agregar al carrito.");
      return;
    }
    try {
      const textoPersonalizado = diseno.elementos
        ?.filter(el => el.tipo === "texto")
        .map(t => t.contenido)
        .join(" | ") || "";

      const precioAdicionalPersonalizacion = 50;
      const precioBase             = parseFloat(diseno.precio_base || 0);
      const precioAdicionalVariante= parseFloat(diseno.precio_adicional || 0);
      const precioUnitario         = precioBase + precioAdicionalVariante + precioAdicionalPersonalizacion;

      const config  = { headers: { Authorization: `Bearer ${token}` } };
      const payload = {
        variante_id:              diseno.variante_id,
        texto_personalizado:      textoPersonalizado,
        imagen_personalizada_url: diseno.imagen_preview,
        precio_adicional:         precioAdicionalPersonalizacion,
        precio_unitario:          precioUnitario,
        cantidad:                 1,
      };

      await axios.post(`${API_BASE}/api/client/carrito`, payload, config);
      mostrarNotificacion("exito", "¡Agregado al carrito!", "El producto se añadió a tu carrito.");
      setTimeout(() => navigate("/cliente/carrito"), 1500);
    } catch {
      mostrarNotificacion("error", "Error", "No se pudo agregar al carrito.");
    }
  };

  if (loading) return (
    <div className="cp-card">
      <p className="cp-loading-inline">Cargando diseños…</p>
    </div>
  );
  if (error) return (
    <div className="cp-card">
      <p className="cp-inline-msg cp-inline-msg--err">{error}</p>
    </div>
  );

  return (
    <div className="cp-card">
      {/* Modales */}
      <ModalConfirmacion
        visible={confirmModal.visible}
        mensaje={confirmModal.mensaje}
        onConfirmar={handleEliminar}
        onCancelar={cerrarConfirmacion}
      />
      <ModalNotificacion
        visible={notifModal.visible}
        tipo={notifModal.tipo}
        titulo={notifModal.titulo}
        mensaje={notifModal.mensaje}
        onCerrar={cerrarNotificacion}
      />

      <h2 className="cp-card__title">Mis diseños guardados</h2>

      {disenos.length === 0 ? (
        <div className="cp-empty-section">
          <span>🎨</span>
          <p>Aún no tienes diseños guardados.</p>
        </div>
      ) : (
        <div className="disenos-grid">
          {disenos.map(d => {
            const imgPreview  = d.imagen_preview?.startsWith("http")  ? d.imagen_preview  : d.imagen_preview  ? `${API_BASE}${d.imagen_preview}`  : null;
            const imgVariante = d.variante_imagen?.startsWith("http") ? d.variante_imagen : d.variante_imagen ? `${API_BASE}${d.variante_imagen}` : null;

            return (
              <div key={d.id} className="diseno-card">
                <div className="diseno-card__img">
                  <img src={imgPreview || imgVariante} alt={d.nombre || "Diseño"} />
                </div>
                <div className="diseno-card__info">
                  <h3>{d.nombre || "Sin nombre"}</h3>
                  <p>Producto: {d.producto_nombre}</p>
                  <p className="diseno-card__date">
                    {new Date(d.fecha_modificacion).toLocaleDateString()}
                  </p>
                </div>
                <div className="diseno-card__actions">
                  <button className="cp-btn cp-btn--small" onClick={() => handleEditar(d)}>✏️ Editar</button>
                  <button className="cp-btn cp-btn--small" onClick={() => handleAgregarAlCarrito(d)}>🛒 Agregar</button>
                  <button className="cp-btn cp-btn--small cp-btn--danger" onClick={() => mostrarConfirmacion(d.id, `¿Eliminar el diseño "${d.nombre || 'seleccionado'}"?`)}>🗑️ Eliminar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MisDisenos;