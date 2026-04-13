import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/public/Header.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Header = ({
  cartCount = 0,
  isLoggedIn = false,
  userName = 'Usuario',
  onSearch = (query) => console.log('Buscar:', query)
}) => {
  const [empresa, setEmpresa] = useState({ nombre_empresa: '', logo_url: '' });
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchWrapperRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ⭐ AHORA USA API_BASE_URL
    fetch(`${API_BASE_URL}/api/empresa`)
      .then(res => res.json())
      .then(json => { if (json.success) setEmpresa(json.data); })
      .catch(err => console.error('Error al cargar empresa:', err))
      .finally(() => setLoadingEmpresa(false));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target))
        setSearchActive(false);
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  const handleSearchToggle = () => setSearchActive(prev => !prev);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchActive(false);
      setMenuOpen(false);
    }
  };

  // Cerrar menú móvil al navegar
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-topline"></div>

      <div className="navbar-inner">

        {/* Logo dinámico */}
        <div className="navbar-logo">
          <Link to="/">
            {loadingEmpresa ? (
              <div className="logo-placeholder" />
            ) : (
              <div className="logo-container">
                {empresa.logo_url && (
                  <img
                    src={empresa.logo_url}
                    alt={empresa.nombre_empresa || 'Logo'}
                    className="logo-image"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
              </div>
            )}
          </Link>
        </div>

        {/* Menú escritorio */}
        <div className="navbar-center">
          <ul className="navbar-menu">
            <li><Link to="/" className="nav-link">Inicio</Link></li>
            <li><Link to="/catalogo" className="nav-link">Productos</Link></li>
            <li><Link to="/nosotros" className="nav-link">Nosotros</Link></li>
            <li><Link to="/contactos" className="nav-link" onClick={closeMenu}>Contacto</Link></li>
          </ul>
        </div>

        {/* Acciones derecha */}
        <div className="navbar-actions">
          <div className={`search-wrapper ${searchActive ? 'active' : ''}`} ref={searchWrapperRef}>
            <form className="search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button className="search-toggle" onClick={handleSearchToggle} aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          <div className="user-area">
            {isLoggedIn ? (
              <Link to="/perfil" className="user-btn">
                <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
                <span className="user-name">{userName}</span>
              </Link>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="auth-link">Iniciar sesión</Link>
                <Link to="/register" className="auth-link primary">Crear cuenta</Link>
              </div>
            )}
          </div>

          <Link to="/register" className="cart-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.5 13h13l2-8H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-search-bar">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        <ul className="mobile-nav">
          <li><Link to="/" onClick={closeMenu}>Inicio</Link></li>
          <li><Link to="/catalogo" onClick={closeMenu}>Catálogo</Link></li>
          <li><Link to="/nosotros" onClick={closeMenu}>Nosotros</Link></li>
          <li><Link to="/contactos" onClick={closeMenu}>Contacto</Link></li>
        </ul>

        <div className="mobile-auth-section">
          {isLoggedIn ? (
            <Link to="/perfil" className="mobile-profile-btn" onClick={closeMenu}>
              <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
              <span>{userName}</span>
            </Link>
          ) : (
            <div className="mobile-auth-links">
              <Link to="/login" className="mobile-auth-secondary" onClick={closeMenu}>Iniciar sesión</Link>
              <Link to="/register" className="mobile-auth-primary" onClick={closeMenu}>Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;