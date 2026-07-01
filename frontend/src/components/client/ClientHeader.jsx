// src/components/client/ClientHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import NotificationBell from './NotificationBell';
import "../../styles/client/ClientHeader.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ClientHeader({ user }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [empresa, setEmpresa] = useState({ nombre_empresa: "", logo_url: "" });
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/empresa`)
      .then(res => res.json())
      .then(json => { if (json.success) setEmpresa(json.data); })
      .catch(err => console.error("Error al cargar empresa:", err))
      .finally(() => setLoadingEmpresa(false));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="ch-header">
      <div className="ch-inner">
        <Link to="/cliente/home" className="ch-logo">
          {loadingEmpresa ? (
            <div className="ch-logo__skeleton" />
          ) : empresa.logo_url ? (
            <img src={empresa.logo_url} alt={empresa.nombre_empresa || "Logo"} className="ch-logo__img" onError={e => e.target.style.display = "none"} />
          ) : (
            <>
              <span className="ch-logo__icon">🖨️</span>
              <span className="ch-logo__name">{empresa.nombre_empresa || "NovaGraf"}</span>
            </>
          )}
        </Link>

        {/* Nav escritorio */}
        <nav className="ch-nav">
          <Link to="/cliente/home" className="ch-nav__link">Inicio</Link>
          <Link to="/cliente/catalogo" className="ch-nav__link">Catálogo</Link>
          {/* 👇 Redirige a "En construcción" */}
          <Link to="/cliente/en-construccion" className="ch-nav__link">Ofertas</Link>
          <Link to="/cliente/compras" className="ch-nav__link">Mis Compras</Link>
        </nav>

        <div className="ch-actions">
            {/* 🔔 Campanita de notificaciones */}
          <NotificationBell />
          <Link to="/cliente/carrito" className="ch-cart" aria-label="Carrito">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.5 13h13l2-8H6"/>
            </svg>
            {cartCount > 0 && (
              <span className="ch-cart__badge">{cartCount}</span>
            )}
          </Link>

          {user ? (
            <button className="ch-user" onClick={() => navigate("/cliente/perfil")} title="Mi perfil">
              <div className="ch-user__avatar">{user.nombre?.charAt(0).toUpperCase()}</div>
              <span className="ch-user__name">{user.nombre}</span>
              <svg className="ch-user__chevron" viewBox="0 0 24 24" width="13" height="13"
                fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          ) : (
            <Link to="/login" className="ch-login">Iniciar sesión</Link>
          )}

          <button
            ref={menuRef}
            className={`ch-hamburger ${menuOpen ? "ch-hamburger--open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menú"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div className={`ch-mobile ${menuOpen ? "ch-mobile--open" : ""}`}>
        <nav className="ch-mobile__nav">
          {[
            { to: "/cliente/home", label: "Inicio" },
            { to: "/cliente/catalogo", label: "Catálogo" },
            { to: "/cliente/en-construccion", label: "Ofertas" }, // 👈 Ruta cambiada
            { to: "/cliente/compras", label: "Mis compras" },
          ].map(({ to, label }) => (
            <Link key={to} to={to} className="ch-mobile__link" onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
        {user && (
          <button className="ch-mobile__profile" onClick={() => { navigate("/cliente/perfil"); setMenuOpen(false); }}>
            <div className="ch-user__avatar ch-user__avatar--sm">
              {user.nombre?.charAt(0).toUpperCase()}
            </div>
            <span>{user.nombre} — Mi perfil</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default ClientHeader;