import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Contactos.css';

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

const getIconoContacto = (tipo) => ICONOS_CONTACTO[tipo?.toLowerCase()] || '📌';
const getRedIcon = (nombre) => RED_ICONS[nombre?.toLowerCase()] || '🌐';

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const getContactoHref = (tipo, valor) => {
  const t = tipo.toLowerCase();
  if (t === 'email' || t === 'correo') return `mailto:${valor}`;
  if (t === 'telefono' || t === 'teléfono') return `tel:${valor}`;
  if (t === 'whatsapp') return `https://wa.me/${valor.replace(/\D/g, '')}`;
  return '#';
};

const Contactos = () => {
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
        if (resUbicacion.status === 'fulfilled' && resUbicacion.value.success && resUbicacion.value.data.length > 0)
          setUbicacion(resUbicacion.value.data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const contactosVisibles = contactos.filter(c => c.tipo_contacto?.toLowerCase() !== 'horario');
  const horario = contactos.find(c => c.tipo_contacto?.toLowerCase() === 'horario');

  if (loading) {
    return (
      <div className="contacto-loading">
        <div className="spinner"></div>
        <p>Cargando información de contacto...</p>
      </div>
    );
  }

  return (
    <div className="contacto-page">
      {/* Hero */}
      <div className="contacto-hero">
        <h1>Contáctanos</h1>
        <p>Estamos aquí para ayudarte a materializar tus ideas</p>
      </div>

      <div className="contacto-container">
        {/* Tarjeta de ubicación */}
        <div className="contacto-card">
          <div className="contacto-card__icon">📍</div>
          <h2>Ubicación</h2>
          {ubicacion ? (
            <div className="contacto-card__content">
              <p>{ubicacion.direccion}</p>
              {ubicacion.ciudad && <p>{ubicacion.ciudad}</p>}
              {ubicacion.codigo_postal && <p>CP {ubicacion.codigo_postal}</p>}
              {ubicacion.estado && <p>{ubicacion.estado}</p>}
              {ubicacion.pais && <p>{ubicacion.pais}</p>}
            </div>
          ) : (
            <p>Información no disponible</p>
          )}
        </div>

        {/* Datos de contacto */}
        <div className="contacto-card">
          <div className="contacto-card__icon">📞</div>
          <h2>Contacto directo</h2>
          <ul className="contacto-list">
            {contactosVisibles.map(c => (
              <li key={c.contacto_id}>
                <span className="contacto-list-icon">{getIconoContacto(c.tipo_contacto)}</span>
                <a href={getContactoHref(c.tipo_contacto, c.valor_contacto)}>
                  {c.valor_contacto}
                </a>
              </li>
            ))}
            {horario && (
              <li>
                <span className="contacto-list-icon">🕒</span>
                <span>{horario.valor_contacto}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Redes sociales */}
        <div className="contacto-card">
          <div className="contacto-card__icon">🌐</div>
          <h2>Redes sociales</h2>
          <div className="redes-grid">
            {redes.map(red => (
              <a
                key={red.red_social_id}
                href={formatUrl(red.url_red_social)}
                target="_blank"
                rel="noopener noreferrer"
                className="red-card"
              >
                <span className="red-icon">{getRedIcon(red.red_social)}</span>
                <span className="red-nombre">{red.red_social}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Mapa (placeholder) - opcional, si tienes coordenadas */}
        {ubicacion && (
          <div className="contacto-card contacto-mapa">
            <div className="contacto-card__icon">🗺️</div>
            <h2>¿Cómo llegar?</h2>
            <div className="mapa-placeholder">
              <iframe
                title="mapa"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(ubicacion.direccion)}&output=embed`}
                width="100%"
                height="250"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contactos;