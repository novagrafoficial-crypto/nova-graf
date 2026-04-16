import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/admin/AdminLayout.css";

const NAV_LINKS = [
  { to: "marcas",        icon: "📦", label: "Gestión de Marcas" },
  { to: "categorias",    icon: "📁", label: "Gestión de Categorías" },
  { to: "subcategorias", icon: "📂", label: "Gestión de Subcategorías" },
  { to: "productos",     icon: "🛍️", label: "Gestión de Productos" },
  { to: "usuarios",      icon: "👥", label: "Gestión de Usuarios" },
  { to: "modulo-extra",  icon: "🗄️", label: "Gestión de BD" },
  { to: "publicacion",   icon: "📰", label: "Administrar Publicación" },
  { to: "empresa",       icon: "🏢", label: "Gestión de Empresa" },
  { to: "stock",         icon: "📊", label: "Predicción de Reabastecimiento" },
];


function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Usuario ──────────────────────────────────────────────────────────────
  const storedUser   = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName    = storedUser?.nombre || storedUser?.name || "Administrador";

  // ── Título de sección activa ─────────────────────────────────────────────
  const activeLink   = NAV_LINKS.find((l) => location.pathname.includes(l.to));
  const sectionTitle = activeLink?.label ?? "Panel de Administración";

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

  return (
    <div className="admin-layout">

      {/* ══ SIDEBAR — posición fija, nunca se mueve ══════════════════════════ */}
      <aside className="admin-sidebar">

        {/* Tarjeta de bienvenida */}
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

        {/* Navegación */}
        <nav className="sidebar-nav">
          {NAV_LINKS.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={location.pathname.includes(to) ? "active" : ""}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Cerrar sesión pegado al fondo */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <span className="logout-icon">⏻</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══ ÁREA DE CONTENIDO — único scroll ════════════════════════════════ */}
      <main className="admin-content">

        {/* Banner con el título de la sección actual */}
        <div className="content-banner">
          <div className="banner-text">
            <h2 className="banner-title">{sectionTitle}</h2>
            <p className="banner-subtitle">Panel de Administración</p>
          </div>
          <div className="banner-decoration" aria-hidden="true" />
        </div>

        {/* Aquí renderizan las páginas hijas */}
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