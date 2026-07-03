import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/admin/AdminLayout.css";

const NAV_LINKS = [
  { to: "marcas",        icon: "📦", label: "Gestión de Marcas" },
  { to: "categorias",    icon: "📁", label: "Gestión de Categorías" },
  { to: "subcategorias", icon: "📂", label: "Gestión de Subcategorías" },
  { to: "productos",     icon: "🛍️", label: "Gestión de Productos" },
  { to: "pedidos",       icon: "📋", label: "Gestión de Pedidos" },
  { to: "usuarios",      icon: "👥", label: "Gestión de Usuarios" },
  { to: "publicacion",   icon: "📰", label: "Administrar Publicación" },
  { to: "empresa",       icon: "🏢", label: "Gestión de Empresa" },
  { to: "ofertas", icon: "🏷️", label: "Ofertas y Descuentos" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName  = storedUser?.nombre || storedUser?.name || "Administrador";

  const activeLink   = NAV_LINKS.find((l) => location.pathname.includes(l.to));
  const sectionTitle = activeLink?.label ?? "Panel de Administración";

  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarNotifs, setMostrarNotifs] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
    const intervalo = setInterval(cargarNotificaciones, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarNotificaciones = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pedidos/notificaciones/${storedUser.id_usuario}`);
      const data = await res.json();
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const marcarLeida = async (id) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/pedidos/notificaciones/${id}/leer`, { method: "PATCH" });
    cargarNotificaciones();
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">

        <div className="sidebar-welcome">
          <div className="welcome-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="welcome-text">
            <p className="welcome-name">{adminName}</p>
          </div>
        </div>

        <div className="sidebar-divider" />
        <p className="sidebar-section-label">Módulos</p>

        <nav className="sidebar-nav">
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link key={to} to={to} className={location.pathname.includes(to) ? "active" : ""}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span className="logout-icon">⏻</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <div className="content-banner">
          <div className="banner-text">
            <button onClick={() => navigate(-1)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.8)", fontSize: "13px",
              display: "flex", alignItems: "center", gap: "6px",
              padding: 0, marginBottom: "8px"
            }}>
              ← Regresar
            </button>
            <h2 className="banner-title">{sectionTitle}</h2>
            <p className="banner-subtitle">Panel de Administración</p>
          </div>

          <div className="notif-wrapper" style={{ marginLeft: "auto", zIndex: 10 }}>
            <button onClick={() => setMostrarNotifs(!mostrarNotifs)} className="notif-btn">
              🔔
              {notificaciones.length > 0 && (
                <span className="notif-badge">{notificaciones.length}</span>
              )}
            </button>
            {mostrarNotifs && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <p>Notificaciones ({notificaciones.length})</p>
                </div>
                {notificaciones.length === 0 ? (
                  <p className="notif-empty">Sin notificaciones</p>
                ) : notificaciones.map((n) => (
                  <div key={n.id} className="notif-item"
                    onClick={() => { marcarLeida(n.id); setMostrarNotifs(false); navigate(`/admin/pedidos/${n.pedido_id}`); }}
                  >
                    <p className="notif-titulo">{n.titulo}</p>
                    <p className="notif-mensaje">{n.mensaje}</p>
                    <p className="notif-fecha">
                      {new Date(n.creado_en).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="banner-decoration" aria-hidden="true" />
        </div>

        <div className="content-inner">
          <Outlet />
        </div>

        <footer className="admin-footer">
          <p>&copy; {new Date().getFullYear()} Panel de Administración · Todos los derechos reservados.</p>
        </footer>
      </main>
    </div>
  );
}

export default AdminLayout;