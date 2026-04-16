import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/admin/AdminLayout.css";

const SEARCH_OPTIONS = [
  { label: "Gestión de Marcas",         path: "marcas",       keywords: ["marca", "marcas", "brand"] },
  { label: "Gestión de Categorías",     path: "categorias",   keywords: ["categoria", "categorias", "categoría", "categorías"] },
  { label: "Gestión de Subcategorías",  path: "subcategorias",keywords: ["subcategoria", "subcategorias", "subcategoría", "subcategorías"] },
  { label: "Gestión de Productos",      path: "productos",    keywords: ["producto", "productos", "product"] },
  { label: "Gestión de Usuarios",       path: "usuarios",     keywords: ["usuario", "usuarios", "user", "cliente", "clientes"] },
  { label: "Gestión de BD",             path: "modulo-extra", keywords: ["base de datos", "bd", "database", "modulo", "módulo"] },
  { label: "Gestión de Pedidos",        path: "pedidos",      keywords: ["pedido", "pedidos", "orden", "ordenes", "order"] },
  { label: "Gestión de Empresa",        path: "empresa",      keywords: ["empresa", "company", "negocio", "información"] },
];

const NAV_LINKS = [
  { to: "marcas",       icon: "📦", label: "Gestión de Marcas" },
  { to: "categorias",   icon: "📁", label: "Gestión de Categorías" },
  { to: "subcategorias",icon: "📂", label: "Gestión de Subcategorías" },
  { to: "productos",    icon: "🛍️", label: "Gestión de Productos" },
  { to: "usuarios",     icon: "👥", label: "Gestión de Usuarios" },
  { to: "modulo-extra", icon: "🗄️", label: "Gestión de BD" },
  { to: "publicacion",  icon: "📰", label: "Administrar Publicación" },
  { to: "empresa",      icon: "🏢", label: "Gestión de Empresa" },
  { to: "stock",        icon: "📊", label: "Predicción de Reabastecimiento" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Usuario ────────────────────────────────────────────────────────────────
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName  = storedUser?.nombre || storedUser?.name || "Administrador";

  // ── Logo / empresa desde API ───────────────────────────────────────────────
  const [empresa,        setEmpresa]        = useState({});
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res  = await fetch("/api/empresa");          // ← ajusta tu endpoint
        const data = await res.json();
        setEmpresa(data);
      } catch (err) {
        console.error("Error al cargar datos de la empresa:", err);
      } finally {
        setLoadingEmpresa(false);
      }
    };
    fetchEmpresa();
  }, []);

  // ── Búsqueda ───────────────────────────────────────────────────────────────
  const [query,       setQuery]       = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown,setShowDropdown]= useState(false);
  const searchRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    const lower    = value.toLowerCase();
    const filtered = SEARCH_OPTIONS.filter(
      (opt) => opt.label.toLowerCase().includes(lower) ||
               opt.keywords.some((kw) => kw.includes(lower))
    );
    setSuggestions(filtered);
    setShowDropdown(true);
  };

  const handleSelect = (path) => {
    navigate(path);
    setQuery(""); setSuggestions([]); setShowDropdown(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter"  && suggestions.length > 0) handleSelect(suggestions[0].path);
    if (e.key === "Escape")                            setShowDropdown(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.removeItem("user"); navigate("/"); };

  // ── Título de sección activa ───────────────────────────────────────────────
  const activeLink  = NAV_LINKS.find((l) => location.pathname.includes(l.to));
  const sectionTitle = activeLink?.label ?? "Panel de Administración";

  return (
    <div className="admin-layout">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="admin-header">

        <div className="header-left">
          {/* Logo dinámico de la empresa */}
          <Link to="/" className="header-logo-link">
            {loadingEmpresa ? (
              <div className="logo-skeleton" />
            ) : empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nombre_empresa || "Logo"}
                className="header-logo-img"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span className="header-logo-fallback">
                {empresa.nombre_empresa?.charAt(0) ?? "A"}
              </span>
            )}
          </Link>

          <div className="header-brand">
            <span className="brand-admin">Admin</span>
            <span className="brand-panel">Panel</span>
          </div>
        </div>

        <div className="header-right">
          {/* Buscador */}
          <div className="search-wrapper" ref={searchRef}>
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar módulo..."
              className="search-bar"
              value={query}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => query && setShowDropdown(true)}
            />
            {showDropdown && (
              <ul className="search-dropdown">
                {suggestions.length > 0
                  ? suggestions.map((opt) => (
                      <li key={opt.path} onClick={() => handleSelect(opt.path)} className="search-dropdown-item">
                        {opt.label}
                      </li>
                    ))
                  : <li className="search-dropdown-item no-results">Sin resultados</li>
                }
              </ul>
            )}
          </div>

          {/* Perfil */}
          <div className="admin-profile">
            <div className="profile-text">
              <span className="profile-greeting">{getGreeting()}</span>
              <span className="admin-name">{adminName}</span>
            </div>
            <div className="avatar-circle">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
            <span className="logout-icon">⏻</span>
            <span className="logout-text">Salir</span>
          </button>
        </div>
      </header>

      {/* ══ SIDEBAR ═════════════════════════════════════════════════════════ */}
      <aside className="admin-sidebar">

        {/* Bienvenida */}
        <div className="sidebar-welcome">
          <div className="welcome-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="welcome-text">
            <p className="welcome-greeting">{getGreeting()},</p>
            <p className="welcome-name">{adminName}</p>
          </div>
        </div>

        <div className="sidebar-divider" />

        <p className="sidebar-section-label">Módulos</p>

        <nav>
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
      </aside>

      {/* ══ CONTENIDO ═══════════════════════════════════════════════════════ */}
      <main className="admin-content">

        {/* Banner de bienvenida / título de sección */}
        <div className="content-banner">
          <div className="banner-text">
            <h2 className="banner-title">{sectionTitle}</h2>
            <p className="banner-subtitle">
              {empresa.nombre_empresa
                ? `${empresa.nombre_empresa} · Panel de Administración`
                : "Panel de Administración"}
            </p>
          </div>
          <div className="banner-decoration" aria-hidden="true" />
        </div>

        <Outlet />
      </main>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="admin-footer">
        <p>
          &copy; {new Date().getFullYear()}{" "}
          {empresa.nombre_empresa || "Panel de Administración"} · Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default AdminLayout;