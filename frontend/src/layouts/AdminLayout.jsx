import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/admin/AdminLayout.css";

const NAV_LINKS = [
  { to: "Registro de atributos", icon: "🗂️", label: "Catálogo" },
  { to: "productos",     icon: "🛍️", label: "Gestión de Productos" },
  { to: "pedidos",       icon: "📋", label: "Gestión de Pedidos" },
  { to: "usuarios",      icon: "👥", label: "Gestión de Usuarios" },
  { to: "publicacion",   icon: "📰", label: "Administrar Publicación" },
  { to: "empresa",       icon: "🏢", label: "Gestión de Empresa" },
  { to: "ofertas", icon: "🏷️", label: "Ofertas y Descuentos" },
  { to: "inventario", icon: "📦", label: "Inventario" },
  { to: "datos-bancarios", icon: "🏦", label: "Datos Bancarios" },
  { to: "metodos-entrega", icon: "🚚", label: "Métodos de Entrega" },
  { to: "reportes", icon: "📊", label: "Reportes" },
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const [empresa, setEmpresa] = useState({ nombre_empresa: "", logo_url: "" });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/empresa`)
      .then((res) => res.json())
      .then((json) => { if (json.success) setEmpresa(json.data); })
      .catch((err) => console.error("Error al cargar logo:", err));
  }, []);

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
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          {empresa.logo_url && (
            <img
              src={empresa.logo_url}
              alt={empresa.nombre_empresa || "Logo"}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          )}
          <span className="sidebar-brand-text">{empresa.nombre_empresa || "Nova Graf"}</span>
        </div>

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
        <header className="admin-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            ☰
          </button>

          <div className="admin-header-titles">
            <button className="admin-header-back" onClick={() => navigate(-1)}>
              ← Regresar
            </button>
            <h2 className="admin-header-title">{sectionTitle}</h2>
            <p className="admin-header-subtitle">Panel de Administración</p>
          </div>

          <div className="admin-header-actions">
            <div className="notif-wrapper">
              <button onClick={() => setMostrarNotifs(!mostrarNotifs)} className="notif-btn" aria-label="Notificaciones">
                🔔
                {notificaciones.length > 0 && <span className="notif-badge">{notificaciones.length}</span>}
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

            <div className="admin-user-chip">
              <div className="admin-user-avatar">{adminName.charAt(0).toUpperCase()}</div>
              <span className="admin-user-name">{adminName}</span>
            </div>
          </div>
        </header>

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