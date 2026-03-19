import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/public/Footer.css';

const ICONOS_CONTACTO = {
  telefono:  '📞',
  teléfono:  '📞',
  email:     '✉️',
  correo:    '✉️',
  whatsapp:  '💬',
  horario:   '🕒',
  fax:       '📠',
};

// Iconos para redes sociales (ampliable)
const RED_ICONS = {
  facebook:  '📘',
  instagram: '📷',
  twitter:   '🐦',
  whatsapp:  '💬',
  youtube:   '📺',
  tiktok:    '🎵',
  linkedin:  '🔗',
  pinterest: '📌',
  snapchat:  '👻',
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
  if (t === 'email'    || t === 'correo')   return `mailto:${valor}`;
  if (t === 'telefono' || t === 'teléfono') return `tel:${valor}`;
  if (t === 'whatsapp')                     return `https://wa.me/${valor.replace(/\D/g, '')}`;
  return '#';
};

const Footer = () => {
  const [redes,     setRedes]     = useState([]);
  const [contactos, setContactos] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/redes-sociales').then(r => r.json()),
      fetch('/api/contactos').then(r => r.json()),
      fetch('/api/ubicacion').then(r => r.json()),
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
  const horario           = contactos.find(c  => c.tipo_contacto?.toLowerCase() === 'horario');
  const year              = new Date().getFullYear();

  return (
    <footer id="contacto" style={styles.footer}>

      <div style={styles.topAccent} />

      <div style={styles.inner}>

        {/* ── Columna 1: Marca ── */}
        <div style={styles.col}>
          <h3 style={styles.brand}>
            Nova Graf<span style={styles.brandDot}>.</span>
          </h3>
          <p style={styles.brandDesc}>
            Especialistas en personalización de artículos con calidad, diseño
            y atención personalizada.
          </p>
        </div>

        {/* ── Columna 2: Contacto ── */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Contacto</h4>
          {loading ? (
            <p style={styles.loadingText}>Cargando...</p>
          ) : (
            <ul style={styles.list}>
              {ubicacion && (
                <li style={styles.listItem}>
                  <span style={styles.listIcon}>📍</span>
                  <span style={styles.listText}>
                    {ubicacion.direccion}{ubicacion.ciudad ? `, ${ubicacion.ciudad}` : ''}
                  </span>
                </li>
              )}
              {contactosVisibles.map(c => (
                <li key={c.contacto_id} style={styles.listItem}>
                  <span style={styles.listIcon}>{getIconoContacto(c.tipo_contacto)}</span>
                  <a href={getContactoHref(c.tipo_contacto, c.valor_contacto)} style={styles.listLink}>
                    {c.valor_contacto}
                  </a>
                </li>
              ))}
              {horario && (
                <li style={styles.listItem}>
                  <span style={styles.listIcon}>🕒</span>
                  <span style={styles.listText}>{horario.valor_contacto}</span>
                </li>
              )}
            </ul>
          )}
        </div>

        {/* ── Columna 3: Síguenos (con el mismo estilo de lista) ── */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Síguenos</h4>
          {loading ? (
            <p style={styles.loadingText}>Cargando...</p>
          ) : redes.length > 0 ? (
            <ul style={styles.list}>
              {redes.map(red => (
                <li key={red.red_social_id} style={styles.listItem}>
                  <span style={styles.listIcon}>{getRedIcon(red.red_social)}</span>
                  <a
                    href={formatUrl(red.url_red_social)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.listLink}
                  >
                    {red.red_social}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.listText}>No hay redes configuradas</p>
          )}
        </div>

        {/* ── Columna 4: Legal (Términos y Políticas) ── */}
        <div style={styles.col}>
          <h4 style={styles.colTitle}>Legal</h4>
          <ul style={styles.list}>
            <li style={styles.listItem}>
              <span style={styles.listIcon}>📄</span>
              <Link to="/terminos" style={styles.listLink}>
                Términos y Condiciones
              </Link>
            </li>
            <li style={styles.listItem}>
              <span style={styles.listIcon}>🔒</span>
              <Link to="/privacidad" style={styles.listLink}>
                Políticas de Privacidad
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* ── Pie de página ── */}
      <div style={styles.bottom}>
        <p style={styles.bottomText}>
          © {year} Nova Graf. Todos los derechos reservados.
        </p>
        <p style={styles.bottomCredit}>Huejutla de Reyes Hidalgo</p>
      </div>

    </footer>
  );
};

const styles = {
  footer:       { background: 'linear-gradient(160deg, #00352c 0%, #004d40 100%)', color: '#e0f2f1', fontFamily: "'Segoe UI', sans-serif", marginTop: '60px' },
  topAccent:    { height: '4px', background: 'linear-gradient(90deg, #80cbc4, #00796b, #004d40)' },
  inner:        { maxWidth: '1100px', margin: '0 auto', padding: '56px 24px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px' },
  col:          { display: 'flex', flexDirection: 'column' },
  brand:        { fontSize: '1.6rem', fontWeight: 700, color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.02em' },
  brandDot:     { color: '#80cbc4' },
  brandDesc:    { fontSize: '0.88rem', color: '#80cbc4', lineHeight: 1.7, margin: '0 0 20px' },
  redesRow:     { display: 'flex', flexDirection: 'column', gap: '10px' }, // (opcional, se puede eliminar)
  redLink:      { display: 'flex', flexDirection: 'column', gap: '2px', textDecoration: 'none', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', transition: 'background 0.2s' }, // (ya no se usa)
  redNombre:    { fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' },
  redUrl:       { fontSize: '0.75rem', color: '#80cbc4', wordBreak: 'break-all' },
  colTitle:     { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#80cbc4', margin: '0 0 20px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  list:         { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '14px' },
  listItem:     { display: 'flex', alignItems: 'flex-start', gap: '10px' },
  listIcon:     { fontSize: '1rem', flexShrink: 0, marginTop: '1px' },
  listText:     { fontSize: '0.9rem', color: '#b2dfdb', lineHeight: 1.5 },
  listLink:     { fontSize: '0.9rem', color: '#b2dfdb', textDecoration: 'none', transition: 'color 0.2s', lineHeight: 1.5 },
  loadingText:  { fontSize: '0.88rem', color: '#80cbc4', margin: 0 },
  bottom:       { borderTop: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  bottomText:   { fontSize: '0.82rem', color: '#546e7a', margin: 0 },
  bottomCredit: { fontSize: '0.82rem', color: '#546e7a', margin: 0 },
};

export default Footer;