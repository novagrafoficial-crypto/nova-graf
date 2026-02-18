import React from 'react';
import '../styles/public/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Columna 1: Logo y descripción */}
        <div className="footer-section">
          <h3>Nova Graf</h3>
          <p>
            Especialistas en personalización de artículos con calidad, diseño 
            y atención personalizada.
          </p>
          <div className="social-icons">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="TikTok">🎵</a>
            <a href="#" aria-label="WhatsApp">💬</a>
          </div>
        </div>

        {/* Columna 2: Enlaces rápidos */}
        <div className="footer-section">
          <h4>Enlaces</h4>
          <ul>
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#nosotros">Sobre Nosotros</a></li>
            <li><a href="#catalogos">Catálogos</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        {/* Columna 3: Contacto */}
        <div className="footer-section">
          <h4>Contacto</h4>
          <ul>
            <li>📞 771 123 4567</li>
            <li>✉️ contacto@novagraf.com</li>
            <li>📍 Yahualica, Hidalgo</li>
            <li>🕒 Lun-Vie: 9am - 6pm</li>
          </ul>
        </div>

        {/* Columna 4: Newsletter */}
        <div className="footer-section">
          <h4>Newsletter</h4>
          <p>Suscríbete para recibir novedades y ofertas</p>
          <div className="newsletter-box">
            <input type="email" placeholder="Tu correo" />
            <button>→</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Nova Graf. Todos los derechos reservados.</p>
        <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.8 }}>
          Diseño con 💚 desde Yahualica
        </p>
      </div>
    </footer>
  );
};

export default Footer;