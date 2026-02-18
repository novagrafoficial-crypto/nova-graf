import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/public/Header.css'; 
import LogoNova from '../assets/LogoNova.png'; // Ruta del logo

const Header = ({
  cartCount = 0,
  isLoggedIn = false,
  userName = 'Usuario',
  onSearch = (query) => console.log('Buscar:', query)
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  const searchWrapperRef = useRef(null);

  // Detectar scroll para cambiar estilo de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar buscador al hacer clic fuera (opcional)
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  // Hover con delay para dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  const handleSearchToggle = () => {
    setSearchActive(!searchActive);
    if (!searchActive) {
      // Enfocar el input cuando se abre
      setTimeout(() => {
        const input = document.querySelector('.search-form input');
        if (input) input.focus();
      }, 100);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setSearchActive(false); // Opcional: cerrar buscador al enviar
    }
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {/* Línea decorativa superior */}
      <div className="navbar-topline"></div>

      <div className="navbar-inner">
        {/* Logo con imagen */}
        <div className="navbar-logo">
          <Link to="/">
            <img
              src={LogoNova}
              alt="Nova Graf"
              style={{ height: '48px', width: 'auto', display: 'block' }}
            />
          </Link>
        </div>

        {/* Menú de navegación (solo escritorio) */}
        <div className="navbar-center">
          <ul className="navbar-menu">
            <li><Link to="/" className="nav-link">Inicio</Link></li>
            <li><Link to="/catalogo" className="nav-link">Catálogo</Link></li>
            <li
              className="dropdown"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className={`dropdown-btn ${dropdownOpen ? 'active' : ''}`}>
                Sobre nosotros
                <svg className="arrow-icon" viewBox="0 0 24 24" width="14" height="14">
                  <path d="M7 10l5 5 5-5z" fill="currentColor" />
                </svg>
              </button>
              <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                <li className="dropdown-header">Conócenos</li>
                <li>
                  <Link to="/nosotros/valores" className="dropdown-link">
                    <span className="dropdown-icon">●</span> Valores
                  </Link>
                </li>
                <li>
                  <Link to="/nosotros/mision" className="dropdown-link">
                    <span className="dropdown-icon">●</span> Misión
                  </Link>
                </li>
                <li>
                  <Link to="/nosotros/vision" className="dropdown-link">
                    <span className="dropdown-icon">●</span> Visión
                  </Link>
                </li>
                <li>
                  <Link to="/nosotros/antecedentes" className="dropdown-link">
                    <span className="dropdown-icon">●</span> Antecedentes
                  </Link>
                </li>
              </ul>
            </li>
            <li><Link to="/contacto" className="nav-link">Contacto</Link></li>
          </ul>
        </div>

        {/* Acciones de la derecha */}
        <div className="navbar-actions">
          {/* Buscador con toggle */}
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

          {/* Área de usuario / autenticación */}
          <div className="user-area">
            {isLoggedIn ? (
              <Link to="/perfil" className="user-btn">
                <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
                <span className="user-name">{userName}</span>
              </Link>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="auth-link">Iniciar sesión</Link>
                <Link to="/register" className="auth-link primary">Registrarse</Link>
              </div>
            )}
          </div>

          {/* Carrito */}
          <Link to="/carrito" className="cart-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.5 13h13l2-8H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          {/* Hamburguesa para móvil */}
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
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link></li>
          <li><Link to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</Link></li>
          <li>
            <button
              className="mobile-dropdown-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Sobre nosotros
              <svg className={`arrow-icon ${dropdownOpen ? 'rotated' : ''}`} viewBox="0 0 24 24" width="14" height="14">
                <path d="M7 10l5 5 5-5z" fill="currentColor" />
              </svg>
            </button>
            {dropdownOpen && (
              <ul className="mobile-sub">
                <li><Link to="/nosotros/valores" onClick={() => setMenuOpen(false)}>Valores</Link></li>
                <li><Link to="/nosotros/mision" onClick={() => setMenuOpen(false)}>Misión</Link></li>
                <li><Link to="/nosotros/vision" onClick={() => setMenuOpen(false)}>Visión</Link></li>
                <li><Link to="/nosotros/antecedentes" onClick={() => setMenuOpen(false)}>Antecedentes</Link></li>
              </ul>
            )}
          </li>
          <li><Link to="/contacto" onClick={() => setMenuOpen(false)}>Contacto</Link></li>
        </ul>

        <div className="mobile-auth-section">
          {isLoggedIn ? (
            <Link to="/perfil" className="mobile-profile-btn" onClick={() => setMenuOpen(false)}>
              <span className="user-avatar">{userName.charAt(0).toUpperCase()}</span>
              <span>{userName}</span>
            </Link>
          ) : (
            <div className="mobile-auth-links">
              <Link to="/login" className="mobile-auth-secondary" onClick={() => setMenuOpen(false)}>Iniciar sesión</Link>
              <Link to="/register" className="mobile-auth-primary" onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;