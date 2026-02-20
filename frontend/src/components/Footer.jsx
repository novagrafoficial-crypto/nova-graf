import React from 'react';
import '../styles/public/Footer.css';
import LogoNova from '../assets/LogoNova.png'; // Ajusta la ruta según tu proyecto

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Columna 1: Logo y descripción */}
        <div className="footer-section">
          <img src={LogoNova} alt="Nova Graf" className="footer-logo-img" />
          <p className="footer-description">
            Especialistas en personalización de artículos con calidad, diseño 
            y atención personalizada.
          </p>
        </div>

        {/* Columna 2: Enlaces importantes */}
        <div className="footer-section">
          <h4>Información legal</h4>
          <ul className="footer-links">
            <li><a href="/terminos">Términos y condiciones</a></li>
            <li><a href="/privacidad">Política de privacidad</a></li>
            <li><a href="/faq">Preguntas frecuentes</a></li>
          </ul>
        </div>

        {/* Columna 3: Información de contacto */}
        <div className="footer-section">
          <h4>Contacto</h4>
          <ul className="contact-info">
            <li>📍 Calle Principal #123, Yahualica, Hidalgo</li>
            <li>📞 771 123 4567</li>
            <li>✉️ contacto@novagraf.com</li>
            <li>🕒 Lun - Vie: 9:00 am - 6:00 pm</li>
          </ul>
        </div>

        {/* Columna 4: Redes sociales */}
        <div className="footer-section">
          <h4>Síguenos</h4>
          <div className="social-icons">
            {/* Puedes reemplazar estos emojis por íconos de react-icons o FontAwesome */}
            <a href="#" aria-label="Facebook" className="social-icon">📘</a>
            <a href="#" aria-label="Instagram" className="social-icon">📷</a>
            <a href="#" aria-label="Twitter" className="social-icon">🐦</a>
            <a href="#" aria-label="TikTok" className="social-icon">🎵</a>
            <a href="#" aria-label="WhatsApp" className="social-icon">💬</a>
          </div>
          {/* Sugerencia: si deseas íconos más profesionales, instala react-icons y usa, por ejemplo:
          import { FaFacebook, FaInstagram, FaTwitter, FaTiktok, FaWhatsapp } from 'react-icons/fa';
          y luego reemplaza los emojis por <FaFacebook />, etc. */}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Nova Graf. Todos los derechos reservados.</p>
        <p className="footer-credit">Diseño con 💚 desde Yahualica</p>
      </div>
    </footer>
  );
};

export default Footer;