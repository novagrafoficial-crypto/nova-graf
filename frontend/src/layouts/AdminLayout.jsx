import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import "../styles/Admin/AdminLayout.css";

const SEARCH_OPTIONS = [
  { label: "Gestión de Marcas", path: "marcas", keywords: ["marca", "marcas", "brand"] },
  { label: "Gestión de Categorías", path: "categorias", keywords: ["categoria", "categorias", "categoría", "categorías"] },
  { label: "Gestión de Subcategorías", path: "subcategorias", keywords: ["subcategoria", "subcategorias", "subcategoría", "subcategorías"] },
  { label: "Gestión de Productos", path: "productos", keywords: ["producto", "productos", "product"] },
  { label: "Gestión de Usuarios", path: "usuarios", keywords: ["usuario", "usuarios", "user", "cliente", "clientes"] },
  { label: "Gestión de BD", path: "modulo-extra", keywords: ["base de datos", "bd", "database", "modulo", "módulo"] },
  { label: "Gestión de Pedidos", path: "pedidos", keywords: ["pedido", "pedidos", "orden", "ordenes", "order"] },
  { label: "Gestión de Empresa", path: "empresa", keywords: ["empresa", "company", "negocio", "información"] },
];

function AdminLayout() {
  const navigate = useNavigate();

  // ─── Leer usuario desde localStorage ───────────────────────────────────────
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const adminName = storedUser?.nombre || storedUser?.name || "Administrador";

  // ─── Búsqueda funcional ─────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

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
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelect(suggestions[0].path);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // Cerrar dropdown al hacer clic fuera
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

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-left">
          <button className="menu-toggle" aria-label="Menú">☰</button>
          <h1>Admin<span>Panel</span></h1>
        </div>

        <div className="header-right">
          {/* ── Buscador con sugerencias ── */}
          <div className="search-wrapper" ref={searchRef} style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Buscar gestión..."
              className="search-bar"
              value={query}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => query && setShowDropdown(true)}
            />

            {showDropdown && suggestions.length > 0 && (
              <ul className="search-dropdown">
                {suggestions.map((opt) => (
                  <li
                    key={opt.path}
                    onClick={() => handleSelect(opt.path)}
                    className="search-dropdown-item"
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}

            {showDropdown && suggestions.length === 0 && query && (
              <ul className="search-dropdown">
                <li className="search-dropdown-item no-results">Sin resultados</li>
              </ul>
            )}
          </div>

          {/* ── Nombre del administrador ── */}
          <div className="admin-profile">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.2 }}>
              <span className="admin-name">Administrador {adminName}</span>
            </div>
            <img src="/avatar-placeholder.png" alt="Avatar" className="avatar" />
          </div>

          <button onClick={handleLogout} className="logout-btn">Cerrar sesión</button>
        </div>
      </header>

      <aside className="admin-sidebar">
        <h2>Menú</h2>
        <nav>
          <Link to="marcas">📦 Gestión de Marcas</Link>
          <Link to="categorias">📁 Gestión de Categorías</Link>
          <Link to="subcategorias">📂 Gestión de Subcategorías</Link>
          <Link to="productos">🛍️ Gestión de Productos</Link>
          <Link to="usuarios">👥 Gestión de Usuarios</Link>
          <Link to="modulo-extra">🗄️ Gestión de BD</Link>
          <Link to="publicacion">📦Administrar Publicacion</Link>
          <Link to="pedidos">📦 Gestión de Pedidos</Link>
          <Link to="empresa">🏢 Gestión de Empresa</Link>
          <Link to="stock">🏢 Predicción de Reabastecimiento</Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>

      <footer className="admin-footer">
        <p>&copy; {new Date().getFullYear()} Panel de Administración. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default AdminLayout;
