import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/public/Footer.css';

// ═══════════════════════════════════════════════════════════
//  URL BASE PARA LA API (desde variable de entorno)
//  En desarrollo local, si no está definida, se usa cadena vacía
//  y el proxy de Vite redirige a localhost:5000
// ═══════════════════════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
    <footer id="contacto" className="footer">
      <div className="footer-inner">
        
        <div className="footer-brand">
          <h3>Nova Graf<span>.</span></h3>
          <p className="footer-brand-desc">
            Especialistas en personalización de artículos con calidad, diseño 
            y atención personalizada.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Contacto</h4>
          {loading ? (
            <p className="footer-loading">Cargando...</p>
          ) : (
            <ul className="footer-list">
              {ubicacion && (
                <li className="footer-list-item">
                  <span className="footer-list-icon">📍</span>
                  <span className="footer-list-text">
                    {ubicacion.direccion}{ubicacion.ciudad ? `, ${ubicacion.ciudad}` : ''}
                  </span>
                </li>
              )}
              {contactosVisibles.map(c => (
                <li key={c.contacto_id} className="footer-list-item">
                  <span className="footer-list-icon">{getIconoContacto(c.tipo_contacto)}</span>
                  <a href={getContactoHref(c.tipo_contacto, c.valor_contacto)} className="footer-list-link">
                    {c.valor_contacto}
                  </a>
                </li>
              ))}
              {horario && (
                <li className="footer-list-item">
                  <span className="footer-list-icon">🕒</span>
                  <span className="footer-list-text">{horario.valor_contacto}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Síguenos</h4>
          <ul className="footer-list">
            {redes.map(red => (
              <li key={red.red_social_id} className="footer-list-item">
                <span className="footer-list-icon">{getRedIcon(red.red_social)}</span>
                <a href={formatUrl(red.url_red_social)} target="_blank" rel="noopener noreferrer" className="footer-list-link">
                  {red.red_social}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Legal</h4>
          <ul className="footer-list">
            <li className="footer-list-item">
              <span className="footer-list-icon">📄</span>
              <Link to="/terminos" className="footer-list-link">Términos y Condiciones</Link>
            </li>
            <li className="footer-list-item">
              <span className="footer-list-icon">🔒</span>
              <Link to="/privacidad" className="footer-list-link">Políticas de Privacidad</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="footer-bottom-text">© {year} Nova Graf. Todos los derechos reservados.</p>
          <p className="footer-bottom-credit">Huejutla de Reyes Hidalgo</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;