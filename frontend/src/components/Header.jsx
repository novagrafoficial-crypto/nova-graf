import React, { useState } from 'react';
import '../styles/Header.css';

const Header = ({ cartCount = 0 }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="navbar-logo">Nova Graf</div>

      {/* Menú de navegación */}
      <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
        <li><a href="#inicio">Inicio</a></li>
        <li><a href="#nosotros">Nosotros</a></li>
        <li><a href="#catalogos">Catálogos</a></li>
        <li><a href="#servicios">Servicios</a></li>
        <li><a href="#contacto">Contacto</a></li>
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
    </header>
  );
};

export default Header;