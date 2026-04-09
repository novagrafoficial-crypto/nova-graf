// frontend/src/pages/public/Contacto.jsx
import React, { useEffect, useState } from 'react';

const Contacto = () => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    fetch('/api/ubicacion')
      .then(res => res.json())
      .then(json => {
        if (json.success) setUbicaciones(json.data);
        else setError('No se pudieron cargar los datos.');
      })
      .catch(() => setError('Error al conectar con el servidor.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>

      {/* ── Encabezado ── */}
      <div style={styles.hero}>
        <div style={styles.heroDecor} />
        <h1 style={styles.heroTitle}>Contáctanos</h1>
        <p style={styles.heroSub}>Estamos donde nos necesitas. Encuéntranos aquí.</p>
        <div style={styles.heroDivider} />
      </div>

      {/* ── Contenido ── */}
      <div style={styles.container}>

        {loading && (
          <div style={styles.statusBox}>
            <div style={styles.spinner} />
            <p style={styles.statusText}>Cargando información...</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <p style={{ margin: '8px 0 0', color: '#c62828' }}>{error}</p>
          </div>
        )}

        {!loading && !error && ubicaciones.length === 0 && (
          <div style={styles.statusBox}>
            <p style={styles.statusText}>No hay ubicaciones registradas aún.</p>
          </div>
        )}

        {!loading && !error && ubicaciones.length > 0 && (
          <div style={styles.grid}>
            {ubicaciones.map((u, index) => (
              <div
                key={u.ubicacion_id}
                style={{
                  ...styles.card,
                  animationDelay: `${index * 0.12}s`,
                }}
              >
                {/* Número de sucursal */}
                <div style={styles.cardBadge}>
                  Sucursal {String(index + 1).padStart(2, '0')}
                </div>

                {/* Dirección */}
                <div style={styles.cardRow}>
                  <span style={styles.cardIcon}>📍</span>
                  <div>
                    <p style={styles.cardLabel}>Dirección</p>
                    <p style={styles.cardValue}>{u.direccion || '—'}</p>
                  </div>
                </div>

                <div style={styles.dividerLine} />

                {/* Ciudad y País en fila */}
                <div style={styles.cardRowDouble}>
                  <div style={styles.cardRow}>
                    <span style={styles.cardIcon}>🏙️</span>
                    <div>
                      <p style={styles.cardLabel}>Ciudad</p>
                      <p style={styles.cardValue}>{u.ciudad || '—'}</p>
                    </div>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardIcon}>🌎</span>
                    <div>
                      <p style={styles.cardLabel}>País</p>
                      <p style={styles.cardValue}>{u.pais || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Código postal */}
                {u.codigo_postal && (
                  <>
                    <div style={styles.dividerLine} />
                    <div style={styles.cardRow}>
                      <span style={styles.cardIcon}>📮</span>
                      <div>
                        <p style={styles.cardLabel}>Código Postal</p>
                        <p style={styles.cardValue}>{u.codigo_postal}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Enlace a Google Maps */}
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${u.direccion}, ${u.ciudad}, ${u.pais}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.mapsBtn}
                  onMouseEnter={e => e.target.style.background = '#00897b'}
                  onMouseLeave={e => e.target.style.background = '#00796b'}
                >
                  Ver en Google Maps →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// ── Estilos ────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f0faf9 0%, #ffffff 60%)',
    fontFamily: "'Segoe UI', sans-serif",
  },

  // Hero
  hero: {
    position: 'relative',
    textAlign: 'center',
    padding: '80px 20px 60px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #004d40 0%, #00796b 100%)',
  },
  heroDecor: {
    position: 'absolute',
    top: '-80px', right: '-80px',
    width: '300px', height: '300px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 12px',
    letterSpacing: '-0.02em',
  },
  heroSub: {
    fontSize: '1.1rem',
    color: '#b2dfdb',
    margin: '0 0 28px',
  },
  heroDivider: {
    width: '60px',
    height: '4px',
    background: '#80cbc4',
    borderRadius: '2px',
    margin: '0 auto',
  },

  // Container
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '60px 20px',
  },

  // Grid de cards
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '28px',
  },

  // Card
  card: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '32px 28px',
    boxShadow: '0 8px 32px rgba(0, 77, 64, 0.10)',
    border: '1px solid #e0f2f1',
    animation: 'slideUp 0.5s ease-out both',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #004d40, #00796b)',
    color: '#fff',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '4px 14px',
    borderRadius: '20px',
    marginBottom: '24px',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    margin: '0',
  },
  cardRowDouble: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  cardIcon: {
    fontSize: '1.3rem',
    marginTop: '2px',
    flexShrink: 0,
  },
  cardLabel: {
    margin: '0 0 2px',
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#80cbc4',
  },
  cardValue: {
    margin: 0,
    fontSize: '0.97rem',
    color: '#263238',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  dividerLine: {
    height: '1px',
    background: '#e0f2f1',
    margin: '20px 0',
  },

  // Botón Maps
  mapsBtn: {
    display: 'inline-block',
    marginTop: '28px',
    padding: '10px 24px',
    background: '#00796b',
    color: '#fff',
    borderRadius: '40px',
    fontSize: '0.88rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'background 0.2s',
    letterSpacing: '0.02em',
  },

  // Estados de carga / error
  statusBox: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  statusText: {
    color: '#90a4ae',
    fontSize: '1rem',
    margin: 0,
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e0f2f1',
    borderTop: '3px solid #00796b',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    textAlign: 'center',
    background: '#fff3f3',
    border: '1px solid #ffcdd2',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '400px',
    margin: '0 auto',
  },
};

export default Contacto;