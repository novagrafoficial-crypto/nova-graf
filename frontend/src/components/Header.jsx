import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // 👈 Importa Link
import '../styles/Header.css';

const Header = ({ cartCount = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      {/* Logo (puede ser Link a inicio) */}
      <div className="navbar-logo">
        <Link to="/">Nova Graf</Link> {/* 👈 Link a Home */}
      </div>

      {/* Menú de navegación */}
      <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#nosotros">Nosotros</a></li>
        <li><a href="#catalogos">Catálogos</a></li>
        <li><a href="#servicios">Servicios</a></li>
        <li><a href="#contacto">Contacto</a></li>
        {/* 👇 Enlaces de autenticación (visibles en escritorio) */}
        <li className="auth-desktop">
          <Link to="/login">Iniciar Sesión</Link>
        </li>
        <li className="auth-desktop">
          <Link to="/register">Registrarse</Link>
        </li>
      </ul>

      {/* Carrito */}
      <div className="navbar-cart">
        <span className="cart-icon">🛒</span>
        <span className="cart-count">{cartCount}</span>
      </div>

      {/* Botón menú hamburguesa (móvil) */}
      <div 
        className={`hamburger ${menuOpen ? 'active' : ''}`} 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Enlaces de autenticación para móvil (dentro del menú hamburguesa) */}
      {menuOpen && (
        <div className="mobile-auth">
          <Link to="/login" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}>Registrarse</Link>
        </div>
      )}
    </header>
  );
};

export default Header;