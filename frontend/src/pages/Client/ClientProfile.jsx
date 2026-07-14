// src/pages/Client/ClientProfile.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MiPerfil from "./profile/MiPerfil";
import MisPedidos from "./profile/MisPedidos";
import MisDisenos from "./profile/MisDisenos";     // ← COMENTADO (no existe)
// import Solicitud from "./profile/Solicitud";       // ← COMENTADO (no existe)
// import Facturacion from "./profile/Facturacion";   // ← COMENTADO (no existe)
// import Historial from "./profile/Historial";       // ← COMENTADO (no existe)
// import Configuracion from "./profile/Configuracion"; // ← COMENTADO (no existe)
import "../../styles/client/Clientprofile.css";

const MENU = [
  { id: "mi-perfil", icon: "👤", label: "Mi perfil" },
  { id: "pedidos", icon: "🛒", label: "Pedidos" },
  { id: "mis-disenos", icon: "🎨", label: "Mis diseños" },   // ← COMENTADO
  // { id: "Solicitud", icon: "💰", label: "Solicitud" },       // ← COMENTADO
  // { id: "facturacion", icon: "🧾", label: "Facturación" },   // ← COMENTADO
  // { id: "historial", icon: "📜", label: "Historial" },       // ← COMENTADO
  // { id: "configuracion", icon: "⚙️", label: "Configuración" },// ← COMENTADO
];

const ModalConfirmacion = ({ visible, onConfirmar, onCancelar }) => {
  if (!visible) return null;
  return (
    <div className="cp-modal-overlay" onClick={onCancelar}>
      <div className="cp-modal-card" onClick={e => e.stopPropagation()}>
        <div className="cp-modal-icon" style={{ background: "#fee2e2" }}>
          <span style={{ fontSize: "28px" }}>⚠️</span>
        </div>
        <h2 className="cp-modal-titulo">Confirmar acción</h2>
        <p className="cp-modal-mensaje">¿Estás seguro de que deseas cerrar sesión?</p>
        <div className="cp-modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción cerrará tu sesión.</span>
        </div>
        <div className="cp-modal-botones">
          <button className="cp-modal-btn cp-modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="cp-modal-btn cp-modal-btn--confirmar" onClick={onConfirmar}>
            Sí, cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente placeholder para secciones en construcción
const EnConstruccion = () => (
  <div className="cp-card">
    <div className="cp-empty-section">
      <span>🚧</span>
      <p>Esta sección está en construcción</p>
    </div>
  </div>
);

const VISTAS = {
  "mi-perfil": <MiPerfil />,
  "pedidos": <MisPedidos />,
  "mis-disenos": <MisDisenos />,
  // "Solicitud": <Solicitud />,
  // "facturacion": <Facturacion />,
  // "historial": <Historial />,
  // "configuracion": <Configuracion />,
};

function ClientProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const [selected, setSelected] = useState(location.state?.activeTab || "mi-perfil");
  const [showModal, setShowModal] = useState(false);

  if (!user) {
    navigate("/");
    return null;
  }

  const confirmarLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  // Si la vista no existe, mostrar "En construcción"
  const VistaActual = VISTAS[selected] || <EnConstruccion />;

  return (
    <div className="cp-wrapper">
      <ModalConfirmacion
        visible={showModal}
        onConfirmar={confirmarLogout}
        onCancelar={() => setShowModal(false)}
      />

      <div className="cp-hero">
        <h2 className="cp-hero__titulo">Mi cuenta</h2>
        <p className="cp-hero__subtitulo">
          Gestiona tu perfil, diseños y compras desde un solo lugar.
        </p>
      </div>

      <div className="cp-layout">
        <aside className="cp-sidebar">
          <div className="cp-sidebar__user">
            <div className="cp-sidebar__avatar">
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="cp-sidebar__info">
              <p className="cp-sidebar__name">{user.nombre}</p>
              <p className="cp-sidebar__email">{user.correo_electronico}</p>
            </div>
          </div>

          <nav className="cp-sidebar__nav">
            {MENU.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`cp-sidebar__item ${selected === id ? "cp-sidebar__item--active" : ""}`}
                onClick={() => setSelected(id)}
              >
                <span className="cp-sidebar__icon">{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <button className="cp-sidebar__logout" onClick={() => setShowModal(true)}>
            🚪 Cerrar sesión
          </button>
        </aside>

        <main className="cp-main">{VistaActual}</main>
      </div>
    </div>
  );
}

export default ClientProfile;