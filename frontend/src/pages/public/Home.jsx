// frontend/src/pages/public/Home.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public/Home.css';

// ═══════════════════════════════════════════════════════════
//  URL BASE PARA LA API (desde variable de entorno)
//  En desarrollo local, si no está definida, se usa cadena vacía
//  y el proxy de Vite redirige a localhost:5000
// ═══════════════════════════════════════════════════════════
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const PASOS = [
  { icon: '🛍️', num: '01', titulo: 'Elige tu producto', desc: 'Explora nuestro catálogo y selecciona el producto base que deseas personalizar.' },
  { icon: '🎨', num: '02', titulo: 'Personalízalo', desc: 'Elige color, agrega tu diseño, logo o texto. Nosotros nos encargamos del resto.' },
  { icon: '🚚', num: '03', titulo: 'Recíbelo en casa', desc: 'Enviamos tu pedido personalizado directo a tu domicilio en tiempo y forma.' },
];

const TESTIMONIOS = [
  { nombre: 'María G.', texto: 'Excelente calidad y atención. Mis tazas personalizadas quedaron perfectas para el evento.', estrellas: 5 },
  { nombre: 'Carlos R.', texto: 'Muy buenos precios y entrega rápida. Volveré a pedir sin duda.', estrellas: 5 },
  { nombre: 'Ana L.', texto: 'El equipo fue muy amable y el resultado superó mis expectativas.', estrellas: 4 },
];

/* ══════════════════════════════════════════
   CARRUSEL CINEMÁTICO — solo imágenes
   Centro: grande con zoom suave
   Lados: más pequeños, clickables para navegar
══════════════════════════════════════════ */
function PortafolioCarousel({ items }) {
  const [current, setCurrent]   = useState(0);
  const [animating, setAnimating] = useState(false);
  const [dir, setDir]           = useState(null);
  const timer = useRef(null);
  const total  = items.length;

  const getIdx = useCallback((offset) =>
    ((current + offset) % total + total) % total,
    [current, total]
  );

  const navigate = useCallback((direction) => {
    if (animating || total < 2) return;
    setDir(direction);
    setAnimating(true);
    timer.current = setTimeout(() => {
      setCurrent(prev =>
        direction === 'right'
          ? (prev + 1) % total
          : (prev - 1 + total) % total
      );
      setAnimating(false);
      setDir(null);
    }, 480);
  }, [animating, total]);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (total === 0) return null;

  const slots =
    total === 1 ? [{ idx: current,      pos: 'center' }]
    : total === 2 ? [{ idx: getIdx(-1), pos: 'left'   }, { idx: current, pos: 'center' }]
    : [
        { idx: getIdx(-1), pos: 'left'   },
        { idx: current,    pos: 'center' },
        { idx: getIdx(1),  pos: 'right'  },
      ];

  return (
    <div className={`cine-wrap${animating ? ` cine-wrap--${dir}` : ''}`}>

      {total > 1 && (
        <button
          className="cine-arrow cine-arrow--left"
          onClick={() => navigate('left')}
          disabled={animating}
          aria-label="Anterior"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      )}

      <div className="cine-stage">
        {slots.map(({ idx, pos }) => (
          <div
            key={`${idx}-${pos}`}
            className={`cine-card cine-card--${pos}`}
            onClick={() => {
              if (pos === 'left')  navigate('left');
              if (pos === 'right') navigate('right');
            }}
          >
            <div className="cine-card__frame">
              <img
                src={items[idx]?.imagen_url
                  || 'https://placehold.co/700x520/1A6163/ffffff?text=NovaGraf'}
                alt={items[idx]?.producto_nombre || `Trabajo ${idx + 1}`}
                draggable={false}
                onError={e => {
                  e.target.src = 'https://placehold.co/700x520/1A6163/ffffff?text=NovaGraf';
                }}
              />
              {pos === 'center' && <div className="cine-card__glow" />}
            </div>
          </div>
        ))}
      </div>

      {total > 1 && (
        <button
          className="cine-arrow cine-arrow--right"
          onClick={() => navigate('right')}
          disabled={animating}
          aria-label="Siguiente"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      )}

      {total > 1 && (
        <div className="cine-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`cine-dot${i === current ? ' cine-dot--on' : ''}`}
              onClick={() => {
                if (i === current || animating) return;
                navigate(i > current ? 'right' : 'left');
              }}
              aria-label={`Imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   HOME
══════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();

  const [portafolio,  setPortafolio]  = useState([]);
  const [mision,      setMision]      = useState(null);
  const [vision,      setVision]      = useState(null);
  const [valores,     setValores]     = useState([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [loadingPort, setLoadingPort] = useState(true);
  const [loadingNos,  setLoadingNos]  = useState(true);

  const [contacto, setContacto] = useState({ nombre: '', correo: '', mensaje: '' });
  const [enviado,  setEnviado]  = useState(false);

  useEffect(() => {
    // ⭐ TODAS LAS PETICIONES AHORA USAN API_BASE_URL
    axios.get(`${API_BASE_URL}/api/public/productos/catalogo`)
      .catch(() => {})
      .finally(() => setLoadingProd(false));

    axios.get(`${API_BASE_URL}/api/public/portafolio`)
      .then(res => {
        const data = res.data?.portafolio ?? res.data ?? [];
        setPortafolio(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingPort(false));

    Promise.allSettled([
      fetch(`${API_BASE_URL}/api/public/mision`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/public/vision`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/public/valores`).then(r => r.json()),
    ]).then(([resMision, resVision, resValores]) => {
      if (resMision.status === 'fulfilled') {
        const d = resMision.value;
        setMision(d?.data ?? d);
      }
      if (resVision.status === 'fulfilled') {
        const d = resVision.value;
        setVision(d?.data ?? d);
      }
      if (resValores.status === 'fulfilled') {
        const d = resValores.value?.data ?? resValores.value;
        setValores(Array.isArray(d) ? d.slice(0, 4) : (d ? [d] : []));
      }
    }).finally(() => setLoadingNos(false));

    // IntersectionObserver para animaciones
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleContacto = (e) => {
    e.preventDefault();
    setEnviado(true);
    setContacto({ nombre: '', correo: '', mensaje: '' });
    setTimeout(() => setEnviado(false), 4000);
  };

  return (
    <main className="home">

      {/* ══ NUEVO HERO MODERNO ══ */}
      <section className="hero-moderno">
        <div className="hero-moderno__bg">
          <div className="hero-moderno__gradient"></div>
          <div className="hero-moderno__particles">
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
            <span className="particle"></span>
          </div>
        </div>
        <div className="hero-moderno__container">
          <div className="hero-moderno__content">
            <span className="hero-moderno__badge">✨ Personalización profesional</span>
            <h1 className="hero-moderno__title">
              Tu marca, <br />
              <span className="hero-moderno__highlight">impresa</span> <br />
              en todo.
            </h1>
            <p className="hero-moderno__desc">
              Transforma cualquier producto con tu imagen, logo o diseño.<br />
              <strong>Calidad garantizada. Entregas puntuales.</strong><br />
              Huejutla de Reyes, Hidalgo.
            </p>
            <div className="hero-moderno__actions">
              <Link to="/catalogo" className="btn-hero btn-hero--primary">
                Ver catálogo
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <a href="#portafolio" className="btn-hero btn-hero--secondary">
                Ver trabajos
              </a>
            </div>
          </div>
          <div className="hero-moderno__image">
            <div className="hero-image-wrapper">
              <div className="hero-image-circle"></div>
              <div className="hero-image-inner">
                <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="200" cy="200" r="180" fill="#35BA99" fillOpacity="0.15" />
                  <path d="M200 60 L240 140 L320 140 L260 190 L280 270 L200 220 L120 270 L140 190 L80 140 L160 140 L200 60Z" fill="#1A6163" stroke="#35BA99" strokeWidth="2" />
                  <circle cx="200" cy="200" r="40" fill="#35BA99" />
                  <path d="M200 170 L210 190 L230 190 L215 205 L220 225 L200 215 L180 225 L185 205 L170 190 L190 190 L200 170Z" fill="white" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-moderno__wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,0 C480,100 960,100 1440,0 L1440,120 L0,120 Z" fill="#f7f5f0" />
          </svg>
        </div>
      </section>

      {/* ══ PORTAFOLIO ══ */}
      <section className="ng-section port-section" id="portafolio" data-animate>
        <div className="ng-section__head">
          <div className="ng-section__label">Portafolio</div>
          <h2 className="ng-section__title">Nuestros Trabajos</h2>
          <p className="ng-section__sub">Ejemplos reales de productos personalizados para nuestros clientes.</p>
        </div>

        {loadingPort ? (
          <div className="ng-loader"><span className="port-spinner" /></div>
        ) : portafolio.length === 0 ? (
          <div className="ng-loader">No hay ejemplos disponibles aún.</div>
        ) : (
          <PortafolioCarousel items={portafolio} />
        )}
      </section>

      {/* ══ CÓMO FUNCIONA ══ */}
      <section className="proceso-section" id="proceso" data-animate>
        <div className="proceso-section__deco" />
        <div className="ng-section__head ng-section__head--light">
          <div className="ng-section__label ng-section__label--light">Proceso</div>
          <h2 className="ng-section__title ng-section__title--light">¿Cómo funciona?</h2>
          <p className="ng-section__sub ng-section__sub--light">Tres pasos para tener tu producto personalizado en manos.</p>
        </div>
        <div className="pasos-row">
          {PASOS.map((paso, i) => (
            <div key={i} className="paso" style={{ '--delay': `${i * 0.15}s` }}>
              <div className="paso__num">{paso.num}</div>
              <div className="paso__icon-wrap"><span className="paso__icon">{paso.icon}</span></div>
              <h3 className="paso__titulo">{paso.titulo}</h3>
              <p className="paso__desc">{paso.desc}</p>
              {i < PASOS.length - 1 && <div className="paso__arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ══ NOSOTROS ══ */}
      <section className="ng-section nosotros-section" id="nosotros" data-animate>
        <div className="ng-section__head">
          <div className="ng-section__label">Nosotros</div>
          <h2 className="ng-section__title">Conoce nuestra esencia</h2>
        </div>
        {loadingNos ? (
          <div className="ng-loader">Cargando…</div>
        ) : (
          <div className="nosotros-layout">
            <div className="nosotros-main">
              <div className="nosotros-card nosotros-card--mission">
                <div className="nosotros-card__icon">🎯</div>
                <h3 className="nosotros-card__title">Misión</h3>
                <p className="nosotros-card__text">{mision?.descripcion || 'Sin información registrada.'}</p>
              </div>
              <div className="nosotros-card nosotros-card--vision">
                <div className="nosotros-card__icon">🔭</div>
                <h3 className="nosotros-card__title">Visión</h3>
                <p className="nosotros-card__text">{vision?.descripcion || 'Sin información registrada.'}</p>
              </div>
            </div>
            {valores.length > 0 && (
              <div className="nosotros-valores">
                <h3 className="nosotros-valores__title">Nuestros valores</h3>
                <ul className="nosotros-valores__list">
                  {valores.map((v, i) => (
                    <li key={i} className="nosotros-valores__item">
                      <span className="nosotros-valores__bullet">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
                      </span>
                      {v.descripcion || v.valor || v.nombre || v.texto || ''}
                    </li>
                  ))}
                </ul>
                <Link to="/nosotros" className="nosotros-link">Conoce más sobre nosotros →</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══ TESTIMONIOS ══ */}
      <section className="testimonios-section" id="testimonios" data-animate>
        <div className="ng-section__head ng-section__head--center">
          <div className="ng-section__label">Clientes</div>
          <h2 className="ng-section__title">Lo que dicen de nosotros</h2>
        </div>
        <div className="testimonios-track">
          {TESTIMONIOS.map((t, i) => (
            <div key={i} className="test-card" style={{ '--delay': `${i * 0.12}s` }}>
              <div className="test-card__stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} className={s < t.estrellas ? 'star star--on' : 'star'}>★</span>
                ))}
              </div>
              <p className="test-card__text">"{t.texto}"</p>
              <div className="test-card__author">
                <span className="test-card__avatar">{t.nombre[0]}</span>
                <strong>{t.nombre}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CONTACTO ══ */}
      <section className="contacto-section" id="contacto-rapido" data-animate>
        <div className="contacto-section__inner">
          <div className="contacto-info">
            <div className="ng-section__label">Contacto</div>
            <h2 className="ng-section__title">¿Tienes un proyecto?</h2>
            <p className="contacto-info__desc">Cuéntanos tu idea y te ayudamos a plasmarla en el producto ideal para ti o tu empresa.</p>
            <ul className="contacto-datos">
              <li><span className="contacto-datos__ico">📍</span> Huejutla de Reyes Hidalgo</li>
              <li><span className="contacto-datos__ico">📧</span> contacto@novagraf.com</li>
              <li><span className="contacto-datos__ico">📞</span> 782 123 4567</li>
            </ul>
          </div>
          <form className="contacto-form" onSubmit={handleContacto}>
            {enviado && <div className="contacto-form__ok">✅ ¡Mensaje enviado! Te contactaremos pronto.</div>}
            <div className="contacto-form__row">
              <div className="contacto-form__field">
                <label>Nombre</label>
                <input type="text" placeholder="Tu nombre" value={contacto.nombre} onChange={e => setContacto(p => ({ ...p, nombre: e.target.value }))} required />
              </div>
              <div className="contacto-form__field">
                <label>Correo</label>
                <input type="email" placeholder="tu@correo.com" value={contacto.correo} onChange={e => setContacto(p => ({ ...p, correo: e.target.value }))} required />
              </div>
            </div>
            <div className="contacto-form__field">
              <label>Mensaje</label>
              <textarea placeholder="Cuéntanos tu proyecto..." rows={5} value={contacto.mensaje} onChange={e => setContacto(p => ({ ...p, mensaje: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-enviar">
              Enviar mensaje
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </form>
        </div>
      </section>

    </main>
  );
};

export default Home;