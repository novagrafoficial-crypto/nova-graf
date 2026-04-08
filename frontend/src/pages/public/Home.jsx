// frontend/src/pages/public/Home.jsx
import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/public/Home.css';

const API = 'http://localhost:5000';

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

const STATS = [
  { valor: '500+', label: 'Clientes felices' },
  { valor: '1,200+', label: 'Productos entregados' },
  { valor: '8', label: 'Años de experiencia' },
  { valor: '100%', label: 'Satisfacción garantizada' },
];

const Home = () => {
  const navigate = useNavigate();

  const [productos,   setProductos]   = useState([]);
  const [portafolio,  setPortafolio]  = useState([]);
  const [mision,      setMision]      = useState(null);
  const [vision,      setVision]      = useState(null);
  const [valores,     setValores]     = useState([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [loadingPort, setLoadingPort] = useState(true);
  const [loadingNos,  setLoadingNos]  = useState(true);

  const [coloresSeleccionados, setColoresSeleccionados] = useState({});
  const [portIdx, setPortIdx] = useState(0);
  const [contacto, setContacto] = useState({ nombre: '', correo: '', mensaje: '' });
  const [enviado,  setEnviado]  = useState(false);
  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    axios.get(`${API}/api/client/productos/catalogo`)
      .then(res => setProductos(res.data.slice(0, 6)))
      .catch(err => console.error('Error productos:', err))
      .finally(() => setLoadingProd(false));

    axios.get(`${API}/api/public/public/portafolio`)
      .then(res => setPortafolio(res.data))
      .catch(err => console.error('Error portafolio:', err))
      .finally(() => setLoadingPort(false));

    Promise.allSettled([
      fetch(`${API}/api/public/mision`).then(r => r.json()),
      fetch(`${API}/api/public/vision`).then(r => r.json()),
      fetch(`${API}/api/public/valores`).then(r => r.json()),
    ]).then(([resMision, resVision, resValores]) => {
      if (resMision.status === 'fulfilled') {
        const d = resMision.value; setMision(d?.data ?? d);
      }
      if (resVision.status === 'fulfilled') {
        const d = resVision.value; setVision(d?.data ?? d);
      }
      if (resValores.status === 'fulfilled') {
        const d = resValores.value?.data ?? resValores.value;
        setValores(Array.isArray(d) ? d.slice(0, 4) : (d ? [d] : []));
      }
    }).finally(() => setLoadingNos(false));

    // IntersectionObserver para animaciones al hacer scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const seleccionarColor = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };

  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  const handleContacto = (e) => {
    e.preventDefault();
    setEnviado(true);
    setContacto({ nombre: '', correo: '', mensaje: '' });
    setTimeout(() => setEnviado(false), 4000);
  };

  const portGrupos = [];
  for (let i = 0; i < portafolio.length; i += 3) {
    portGrupos.push(portafolio.slice(i, i + 3));
  }

  return (
  <main className="home">
    {/* ══════════════════════════════════════════
          HERO (Estilo Kids Gift Shop)
        ══════════════════════════════════════════ */}
    <section className="hero-nova">
      {/* El fondo ahora es un contenedor limpio */}
      <div className="hero-nova__inner">
        
        {/* LADO IZQUIERDO: TEXTO Y ACCIONES */}
        <div className="hero-nova__content">
          <div className="hero-nova__badge">
             <span>✨ Personalización profesional</span>
          </div>
          <h1 className="hero-nova__titulo">
            Tu marca, <br />
            <span className="hero-nova__destaque">impresa</span> <br />
            en todo.
          </h1>
          <p className="hero-nova__desc">
            Transforma cualquier producto con tu imagen, logo o diseño. <br />
            <strong>Calidad garantizada. Entregas puntuales.</strong> <br />
            Huejutla de Reyes, Hidalgo.
          </p>
          <div className="hero-nova__actions">
            <Link to="/catalogo" className="btn-redondeado btn-principal">
              Ver catálogo
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <a href="#portafolio" className="btn-redondeado btn-secundario">Ver trabajos</a>
          </div>
        </div>
      </div>

      {/* LA CURVA: El toque que hace que se vea como el ejemplo que te gustó */}
      <div className="hero-nova__curva">
  <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M0,0 C480,100 960,100 1440,0 L1440,120 L0,120 Z" 
      fill="#1A6163">
    </path>
  </svg>
</div>
    </section>
      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div className="stats-bar">
        {STATS.map((s, i) => (
          <div key={i} className="stats-bar__item">
            <strong>{s.valor}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          PORTAFOLIO
      ══════════════════════════════════════════ */}
      <section className="ng-section" id="portafolio" data-animate>
        <div className="ng-section__head">
          <div className="ng-section__label">Portafolio</div>
          <h2 className="ng-section__title">Nuestros Productos</h2>
          <p className="ng-section__sub">Ejemplos reales de productos personalizados para nuestros clientes.</p>
        </div>

        {loadingPort ? (
          <div className="ng-loader">Cargando portafolio…</div>
        ) : portafolio.length === 0 ? (
          <div className="ng-loader">No hay ejemplos disponibles.</div>
        ) : (
          <div className="port-wrapper">
            <div className="port-grid">
              {portGrupos[portIdx]?.map((item, i) => (
                <div key={item.id ?? i} className="port-card" style={{ '--delay': `${i * 0.1}s` }}>
                  <div className="port-card__img-box">
                    <img
                      src={item.imagen_url || 'https://placehold.co/500x380?text=Sin+imagen'}
                      alt={item.descripcion || 'Portafolio'}
                      className="port-card__img"
                      onError={e => { e.target.src = 'https://placehold.co/500x380?text=Sin+imagen'; }}
                    />
                    <div className="port-card__hover">
                      {item.producto_nombre && (
                        <span className="port-card__tag">{item.producto_nombre}</span>
                      )}
                      <p className="port-card__desc">{item.descripcion?.substring(0, 90) || ''}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {portGrupos.length > 1 && (
              <div className="port-nav">
                <button className="port-nav__btn" onClick={() => setPortIdx(i => Math.max(i - 1, 0))} disabled={portIdx === 0}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="port-nav__dots">
                  {portGrupos.map((_, i) => (
                    <button key={i} className={`port-nav__dot${portIdx === i ? ' port-nav__dot--on' : ''}`} onClick={() => setPortIdx(i)} />
                  ))}
                </div>
                <button className="port-nav__btn" onClick={() => setPortIdx(i => Math.min(i + 1, portGrupos.length - 1))} disabled={portIdx === portGrupos.length - 1}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          CÓMO FUNCIONA
      ══════════════════════════════════════════ */}
      <section className="proceso-section" id="proceso">
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
              <div className="paso__icon-wrap">
                <span className="paso__icon">{paso.icon}</span>
              </div>
              <h3 className="paso__titulo">{paso.titulo}</h3>
              <p className="paso__desc">{paso.desc}</p>
              {i < PASOS.length - 1 && <div className="paso__arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          NOSOTROS
      ══════════════════════════════════════════ */}
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
                <Link to="/nosotros/mision" className="nosotros-link">Conoce más sobre nosotros →</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIOS
      ══════════════════════════════════════════ */}
      <section className="testimonios-section" id="testimonios">
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

      {/* ══════════════════════════════════════════
          CONTACTO
      ══════════════════════════════════════════ */}
      <section className="contacto-section" id="contacto-rapido">
        <div className="contacto-section__inner">
          <div className="contacto-info">
            <div className="ng-section__label">Contacto</div>
            <h2 className="ng-section__title">¿Tienes un proyecto?</h2>
            <p className="contacto-info__desc">
              Cuéntanos tu idea y te ayudamos a plasmarla en el producto ideal para ti o tu empresa.
            </p>
            <ul className="contacto-datos">
              <li>
                <span className="contacto-datos__ico">📍</span>
                Huejutla de Reyes Hidalgo
              </li>
              <li>
                <span className="contacto-datos__ico">📧</span>
                contacto@novagraf.com
              </li>
              <li>
                <span className="contacto-datos__ico">📞</span>
                782 123 4567
              </li>
            </ul>
          </div>

          <form className="contacto-form" onSubmit={handleContacto}>
            {enviado && (
              <div className="contacto-form__ok">
                ✅ ¡Mensaje enviado! Te contactaremos pronto.
              </div>
            )}
            <div className="contacto-form__row">
              <div className="contacto-form__field">
                <label>Nombre</label>
                <input
                  type="text" placeholder="Tu nombre"
                  value={contacto.nombre}
                  onChange={e => setContacto(p => ({ ...p, nombre: e.target.value }))}
                  required
                />
              </div>
              <div className="contacto-form__field">
                <label>Correo</label>
                <input
                  type="email" placeholder="tu@correo.com"
                  value={contacto.correo}
                  onChange={e => setContacto(p => ({ ...p, correo: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="contacto-form__field">
              <label>Mensaje</label>
              <textarea
                placeholder="Cuéntanos tu proyecto..." rows={5}
                value={contacto.mensaje}
                onChange={e => setContacto(p => ({ ...p, mensaje: e.target.value }))}
                required
              />
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