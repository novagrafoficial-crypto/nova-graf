// frontend/src/pages/public/PortafolioPublico.jsx
import { useState, useEffect } from 'react';
import '../../styles/public/PortafolioPublico.css';

const API_BASE = import.meta.env.VITE_API_URL;

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" width="12" height="12">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
);

const IconLink = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" width="16" height="16">
    <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
  </svg>
);

const IconImagen = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.2" stroke="white" width="48" height="48">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <path d="M21 15l-5-5L5 21"/>
  </svg>
);

/* ── MODAL LIGHTBOX ── */
function Modal({ trabajo, onClose }) {
  const fecha = new Date(trabajo.fecha_creacion).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-imagen">
          {trabajo.imagen_url
            ? <img src={trabajo.imagen_url} alt={trabajo.producto_nombre} />
            : <div className="imagen-placeholder"><IconImagen /></div>
          }
        </div>

        <div className="modal-info">
          {trabajo.categoria && (
            <span className="chip-categoria" style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
              {trabajo.categoria}
            </span>
          )}
          <h2>{trabajo.producto_nombre || 'Producto personalizado'}</h2>
          {trabajo.descripcion && <p>{trabajo.descripcion}</p>}
          <div className="modal-fecha">
            <IconCalendar />
            {fecha}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TARJETA ── */
function TarjetaPortafolio({ trabajo, featured = false, onVerDetalle }) {
  const fecha = new Date(trabajo.fecha_creacion).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div
      className={`portafolio-card${featured ? ' featured' : ''}`}
      onClick={() => onVerDetalle(trabajo)}
    >
      <div className="portafolio-imagen">
        {trabajo.imagen_url
          ? <img src={trabajo.imagen_url} alt={trabajo.producto_nombre || 'Producto'} />
          : <div className="imagen-placeholder"><IconImagen /><span>Sin imagen</span></div>
        }
        <div className="imagen-overlay">
          <div className="overlay-cta">
            <IconLink />
            Ver detalle{featured ? ' del producto' : ''}
          </div>
        </div>
        {featured && <div className="card-badge">✦ Destacado</div>}
      </div>

      <div className="portafolio-info">
        {featured && (
          <div className="featured-label">
            <span></span>Proyecto destacado
          </div>
        )}
        <h3>{trabajo.producto_nombre || 'Producto personalizado'}</h3>
        {trabajo.descripcion && <p>{trabajo.descripcion}</p>}
        <div className="info-footer">
          <div className="portafolio-fecha">
            <IconCalendar />{fecha}
          </div>
          {trabajo.categoria && (
            <span className="chip-categoria">{trabajo.categoria}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── PÁGINA PRINCIPAL ── */
function PortafolioPublico() {
  const [trabajos, setTrabajos]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modalTrabajo, setModal]  = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/public/portafolio`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setTrabajos(data.portafolio);
        else setError('No se pudieron cargar los trabajos');
      })
      .catch(() => setError('Error de conexión'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="portafolio-loading">Cargando trabajos...</div>;
  if (error)   return <div className="portafolio-error">{error}</div>;

  return (
    <div className="portafolio-container">
      {/* Modal */}
      {modalTrabajo && (
        <Modal trabajo={modalTrabajo} onClose={() => setModal(null)} />
      )}

      {/* Header */}
      <div className="portafolio-header">
        <p className="header-eyebrow">Casos de éxito</p>
        <h1>Nuestros <span>trabajos</span> realizados</h1>
        <div className="header-divider"></div>
        <p>Conoce algunos de los productos personalizados que hemos entregado a nuestros clientes</p>
      </div>

      {/* Grid */}
      {trabajos.length === 0 ? (
        <p className="portafolio-empty">Aún no hay trabajos publicados.</p>
      ) : (
        <div className="portafolio-grid-wrapper">
          <div className="portafolio-grid">
            {trabajos.map((trabajo, index) => (
              <TarjetaPortafolio
                key={trabajo.id}
                trabajo={trabajo}
                featured={index === 0}
                onVerDetalle={setModal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PortafolioPublico;