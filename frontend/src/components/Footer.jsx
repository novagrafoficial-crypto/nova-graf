import React from 'react';
import '../styles/public/Footer.css';

// ═══════════════════════════════════════════════════════════
//  URL BASE PARA LA API (desde variable de entorno)
//  En desarrollo local, si no está definida, se usa cadena vacía
//  y el proxy de Vite redirige a localhost:5000
// ═══════════════════════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ICONOS_CONTACTO = {
  telefono: '📞',
  teléfono: '📞',
  email: '✉️',
  correo: '✉️',
  whatsapp: '💬',
  horario: '🕒',
};

const RED_ICONS = {
  facebook: '📘',
  instagram: '📷',
  twitter: '🐦',
  whatsapp: '💬',
  youtube: '📺',
  tiktok: '🎵',
  linkedin: '🔗',
};

const getIconoContacto = (tipo = '') => ICONOS_CONTACTO[tipo.toLowerCase()] || '📌';

const getRedIcon = (nombre = '') => {
  const key = nombre.toLowerCase();
  return RED_ICONS[key] || '🌐';
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const getContactoHref = (tipo = '', valor = '') => {
  const t = tipo.toLowerCase();
  if (t === 'email' || t === 'correo') return `mailto:${valor}`;
  if (t === 'telefono' || t === 'teléfono') return `tel:${valor}`;
  if (t === 'whatsapp') return `https://wa.me/${valor.replace(/\D/g, '')}`;
  return '#';
};

const Footer = () => {
  const [redes, setRedes] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE_URL}/api/redes-sociales`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/contactos`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/ubicacion`).then(r => r.json()),
    ])
      .then(([resRedes, resContactos, resUbicacion]) => {
        if (resRedes.status === 'fulfilled' && resRedes.value.success)
          setRedes(resRedes.value.data);
        if (resContactos.status === 'fulfilled' && resContactos.value.success)
          setContactos(resContactos.value.data);
        if (resUbicacion.status === 'fulfilled' && resUbicacion.value.success
            && resUbicacion.value.data.length > 0)
          setUbicacion(resUbicacion.value.data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const contactosVisibles = contactos.filter(c => c.tipo_contacto?.toLowerCase() !== 'horario');
  const horario = contactos.find(c => c.tipo_contacto?.toLowerCase() === 'horario');
  const year = new Date().getFullYear();

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
          <h4>Redes Sociales</h4>
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