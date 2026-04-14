import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import "../styles/admin/AdminLayout.css";

// ✅ Ruta corregida (relativa desde layouts hacia logo)
import logoNova from "../logo/LOGO.png";

// Íconos SVG
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Marcas: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7L9 18L4 13" stroke="currentColor" strokeLinecap="round"/></svg>,
  Categorias: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z M8 8h8v8H8z"/></svg>,
  Subcategorias: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z"/></svg>,
  Productos: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  Usuarios: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  BD: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/></svg>,
  Publicaciones: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z M8 8h8M8 12h6M8 16h4"/></svg>,
  Pedidos: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Empresa: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M12 11v6M8 11v2M16 11v2"/></svg>,
  Inventario: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M8 12h8"/></svg>,
  Proveedores: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>,
  Atributos: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Logout: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  Package: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6l8-4 8 4M4 6v8l8 4 8-4V6M4 6l8 4 8-4M12 10v8"/></svg>,
};

const SEARCH_OPTIONS = [
  { label: "Gestión de Marcas", path: "marcas", keywords: ["marca", "marcas", "brand"] },
  { label: "Gestión de Categorías", path: "categorias", keywords: ["categoria", "categorias", "categoría", "categorías"] },
  { label: "Gestión de Subcategorías", path: "subcategorias", keywords: ["subcategoria", "subcategorias", "subcategoría", "subcategorías"] },
  { label: "Gestión de Productos", path: "productos", keywords: ["producto", "productos", "product"] },
  { label: "Gestión de Usuarios", path: "usuarios", keywords: ["usuario", "usuarios", "user", "cliente", "clientes"] },
  { label: "Gestión de BD", path: "modulo-extra", keywords: ["base de datos", "bd", "database", "modulo", "módulo"] },
  { label: "Gestión de Pedidos", path: "pedidos", keywords: ["pedido", "pedidos", "orden", "ordenes", "order"] },
  { label: "Gestión de Empresa", path: "empresa", keywords: ["empresa", "company", "negocio", "información"] },
  { label: "Gestión de Inventario", path: "inventario", keywords: ["inventario", "stock", "almacen"] },
  { label: "Gestión de Proveedores", path: "proveedores", keywords: ["proveedor", "supplier"] },
  { label: "Atributos de Productos", path: "Atributos", keywords: ["atributo", "atributos", "variante"] },
];

const NAV_ITEMS = [
  { to: "marcas",       icon: Icons.Marcas, label: "Marcas", description: "Administra tus marcas" },
  { to: "categorias",   icon: Icons.Categorias, label: "Categorías", description: "Organiza por categorías" },
  { to: "subcategorias",icon: Icons.Subcategorias, label: "Subcategorías", description: "Subcategorías detalladas" },
  { to: "productos",    icon: Icons.Productos, label: "Productos", description: "Control de inventario" },
  { to: "usuarios",     icon: Icons.Usuarios, label: "Usuarios", description: "Clientes y administradores" },
  { to: "modulo-extra", icon: Icons.BD, label: "Base de Datos", description: "Gestión de BD" },
  { to: "publicacion",  icon: Icons.Publicaciones, label: "Publicaciones", description: "Contenido y noticias" },
  { to: "pedidos",      icon: Icons.Pedidos, label: "Pedidos", description: "Seguimiento de órdenes" },
  { to: "empresa",      icon: Icons.Empresa, label: "Empresa", description: "Información corporativa" },
  { to: "inventario",   icon: Icons.Inventario, label: "Inventario", description: "Stock y almacén" },
  { to: "proveedores",  icon: Icons.Proveedores, label: "Proveedores", description: "Gestión de proveedores" },
  { to: "Atributos",    icon: Icons.Atributos, label: "Atributos", description: "Atributos de productos" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser?.nombre || storedUser?.name || "Administrador";
  const adminEmail = storedUser?.email || "admin@empresa.com";

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef(null);

  const [pedidosPendientes] = useState(12);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() === "") {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const lower = value.toLowerCase();
    const filtered = SEARCH_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        opt.keywords.some((kw) => kw.includes(lower))
    );
    setSuggestions(filtered);
    setShowDropdown(true);
  };

  const handleSelect = (path) => {
    navigate(path);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setSidebarOpen(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) handleSelect(suggestions[0].path);
    if (e.key === "Escape") setShowDropdown(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (path) => location.pathname.includes(path);
  const isRootPath = location.pathname === "/admin" || location.pathname === "/admin/";

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            <Icons.Menu />
          </button>
          <Link to="/admin" className="logo-link">
            <img src={logoNova} alt="NOVA GRAF" className="header-logo" />
          </Link>
        </div>

        <div className="header-right">
          <div className="pedidos-pendientes">
            <Icons.Package />
            <span className="pedidos-label">Pedidos pendientes</span>
            <span className="pedidos-count">{pedidosPendientes}</span>
          </div>

          <div className="search-wrapper" ref={searchRef}>
            <span className="search-icon"><Icons.Search /></span>
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
                {suggestions.length > 0 ? (
                  suggestions.map((opt) => (
                    <li key={opt.path} onClick={() => handleSelect(opt.path)} className="search-dropdown-item">
                      {opt.label}
                    </li>
                  ))
                ) : (
                  <li className="search-dropdown-item no-results">Sin resultados</li>
                )}
              </ul>
            )}
          </div>

          <div className="admin-profile">
            <span className="admin-name">{adminName}</span>
            <div className="avatar">
              <span>{adminName.charAt(0).toUpperCase()}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn">
            <Icons.Logout />
            <span>Salir</span>
          </button>
        </div>
      </header>

      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img src={logoNova} alt="NOVA GRAF" className="sidebar-logo" />
          </div>
          <div className="user-info-sidebar">
            <div className="user-avatar-sidebar">
              <span>{adminName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-details">
              <strong>{adminName}</strong>
              <small>{adminEmail}</small>
            </div>
          </div>
        </div>
        <nav>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={isActive(to) ? "active" : ""}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon"><Icon /></span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        {isRootPath ? (
          <div className="welcome-screen">
            <div className="welcome-header">
              <div className="welcome-greeting">
                <h2>{getGreeting()}, {adminName}</h2>
                <p>Panel de administración NOVA GRAF</p>
              </div>
              <div className="welcome-time">
                <span className="time-text">{formatDate()}</span>
              </div>
            </div>

            <div className="quick-access">
              <h3>Módulos disponibles</h3>
              <div className="quick-grid">
                {NAV_ITEMS.map(({ to, icon: Icon, label, description }) => (
                  <div key={to} className="quick-card" onClick={() => navigate(to)}>
                    <div className="quick-icon"><Icon /></div>
                    <div className="quick-info">
                      <h4>{label}</h4>
                      <p>{description}</p>
                    </div>
                    <div className="quick-arrow"><Icons.ArrowRight /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="admin-footer">
        <div className="footer-logo">
          <img src={logoNova} alt="NOVA GRAF" className="footer-logo-img" />
        </div>
        <p>© {new Date().getFullYear()} NOVA GRAF — Panel de Administración</p>
        <div className="footer-links">
          <a href="#">Soporte</a>
        </div>
      </footer>
    </div>
  );
}

export default AdminLayout;