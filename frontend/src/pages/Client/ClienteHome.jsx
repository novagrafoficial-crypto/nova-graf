import { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import '../../styles/client/ClientHome.css';

const API_URL = import.meta.env.VITE_API_URL;
const HOME_API = `${API_URL}/api/client/home`;

export default function ClienteHome() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();
  const [portafolio, setPortafolio] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [stats, setStats] = useState({ total_portafolio: 0, total_productos: 0, total_categorias: 0 });
  const [loading, setLoading] = useState(true);
  const [catActiva, setCatActiva] = useState('todas');
  const [visible, setVisible] = useState(false);
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch(HOME_API)
      .then(r => r.json())
      .then(data => {
        setPortafolio(data.portafolio || []);
        setProductos(data.productos || []);
        setCategorias(data.categorias || []);
        setStats(data.stats || {});
      })
      .catch(err => console.error('Error:', err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      });
  }, []);

  // Partículas animadas en canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height)  p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 255, 160, ${p.alpha})`;
        ctx.fill();
      });
      // Líneas entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100, 220, 140, ${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [loading]);

  // Parallax
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current)
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const productosFiltrados = catActiva === 'todas'
    ? productos
    : productos.filter(p => p.categoria_nombre?.toLowerCase() === catActiva.toLowerCase());

  if (loading) return <LoadingHome />;

  return (
    <div className={`home-page ${visible ? 'home-page--in' : ''}`}>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="home-hero">
        <div className="home-hero__bg" ref={heroRef} />
        <canvas ref={canvasRef} className="home-hero__canvas" />

        {/* Formas decorativas */}
        <div className="home-hero__blob home-hero__blob--1" />
        <div className="home-hero__blob home-hero__blob--2" />
        <div className="home-hero__ring home-hero__ring--1" />
        <div className="home-hero__ring home-hero__ring--2" />

        <div className="home-hero__content">
          <span className="home-hero__chip">
       
          </span>

          <h1 className="home-hero__title">
            Hola,{' '}
            <span className="home-hero__name">
              {user?.nombre || 'Cliente'}
            </span>
            <br />
            <span className="home-hero__sub">¿Qué creamos hoy?</span>
          </h1>

          <p className="home-hero__desc">
            Diseña, personaliza y lleva tu marca al siguiente nivel.<br />
            Cada producto es único, igual que tu visión.
          </p>

          <div className="home-hero__ctas">
            <button className="home-cta home-cta--primary"
              onClick={() => navigate('/cliente/catalogo')}>
              <span>Explorar catálogo</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="home-cta home-cta--ghost"
              onClick={() => document.getElementById('portafolio')?.scrollIntoView({ behavior: 'smooth' })}>
              Ver trabajos
            </button>
          </div>
        </div>
      </section>

      {/* ══ CATEGORÍAS ════════════════════════════════════════ */}
      {categorias.length > 0 && (
        <section className="home-section home-section--cats">
          <div className="home-cats-wrap">
            <div className="home-section__eyebrow">Colecciones</div>
            <h2 className="home-section__title">Navega por categoría</h2>
            <div className="home-cats">
              <button
                className={`home-cat ${catActiva === 'todas' ? 'home-cat--on' : ''}`}
                onClick={() => setCatActiva('todas')}
              >
                <span className="home-cat__emoji">✦</span>
                Todos
                <span className="home-cat__count">{productos.length}</span>
              </button>
              {categorias.map(c => (
                <button
                  key={c.id}
                  className={`home-cat ${catActiva === c.nombre.toLowerCase() ? 'home-cat--on' : ''}`}
                  onClick={() => setCatActiva(c.nombre.toLowerCase())}
                >
                  <span className="home-cat__emoji">◈</span>
                  {c.nombre}
                  <span className="home-cat__count">{c.total_productos}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ PRODUCTOS DESTACADOS ══════════════════════════════ */}
      {productos.length > 0 && (
        <section className="home-section">
          <div className="home-section__head">
            <div>
              <div className="home-section__eyebrow">Destacados</div>
              <h2 className="home-section__title">Productos para personalizar</h2>
            </div>
            <button className="home-link" onClick={() => navigate('/cliente/catalogo')}>
              Ver todos →
            </button>
          </div>

          <div className="home-grid home-grid--products">
            {productosFiltrados.length === 0
              ? <p className="home-empty">Sin productos en esta categoría.</p>
              : productosFiltrados.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    producto={p}
                    idx={i}
                    onClick={() => navigate(`/cliente/producto/${p.id}`)}
                  />
                ))
            }
          </div>
        </section>
      )}

      {/* ══ BANNER ════════════════════════════════════════════ */}
      <section className="home-banner">
        <div className="home-banner__bg" />
        <div className="home-banner__orbs">
          <div className="home-banner__orb home-banner__orb--1" />
          <div className="home-banner__orb home-banner__orb--2" />
        </div>
        <div className="home-banner__body">
          <div className="home-banner__left">
            <h2>¿Tienes una idea<br />en mente?</h2>
            <p>Elige un producto, sube tu diseño o pídenos uno desde cero. Nuestro equipo lo hace realidad.</p>
            <button className="home-cta home-cta--white"
              onClick={() => navigate('/cliente/catalogo')}>
              <span>Comenzar proyecto</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="home-banner__icons">
           
          </div>
        </div>
      </section>

      {/* ══ PORTAFOLIO ════════════════════════════════════════ */}
      <section className="home-section" id="portafolio">
        <div className="home-section__head">
          <div>
            <div className="home-section__eyebrow">Portafolio</div>
            <h2 className="home-section__title">Trabajos realizados</h2>
          </div>
        </div>

        {portafolio.length === 0 ? (
          <div className="home-empty-state">
            <span>🖼️</span>
            <p>Aún no hay trabajos publicados.</p>
          </div>
        ) : (
          <div className="home-grid home-grid--portfolio">
            {portafolio.map((item, i) => (
              <PortfolioCard key={item.id} item={item} idx={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

/* ══ STAT BUBBLE ══════════════════════════════════════════════ */
function StatBubble({ value, label, icon, delay }) {
  return (
    <div className="home-stat" style={{ animationDelay: delay }}>
      <span className="home-stat__icon">{icon}</span>
      <strong className="home-stat__value">{value}</strong>
      <span className="home-stat__label">{label}</span>
    </div>
  );
}

/* ══ PRODUCT CARD ═════════════════════════════════════════════ */
function ProductCard({ producto: p, idx, onClick }) {
  const [hovered, setHovered] = useState(false);
  const img = p.imagen_url?.startsWith('http')
    ? p.imagen_url
    : p.imagen_url ? `http://localhost:5000${p.imagen_url}` : null;
  const precio = parseFloat(p.precio_min || p.precio_base || 0);

  return (
    <article
      className={`pcard ${hovered ? 'pcard--hovered' : ''}`}
      style={{ '--delay': `${idx * 0.08}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="pcard__media">
        {img
          ? <img src={img} alt={p.nombre} loading="lazy" />
          : <div className="pcard__no-img">🛍️</div>
        }
        {p.categoria_nombre && (
          <span className="pcard__cat">{p.categoria_nombre}</span>
        )}
        <div className="pcard__shine" />
        <div className="pcard__hover-cta">
          <span>✦ Personalizar</span>
        </div>
      </div>

      <div className="pcard__body">
        <h3 className="pcard__name">{p.nombre}</h3>
        {p.descripcion && (
          <p className="pcard__desc">{p.descripcion}</p>
        )}
        <div className="pcard__foot">
          <div className="pcard__price-wrap">
            <span className="pcard__desde">desde</span>
            <strong className="pcard__price">${precio.toFixed(2)}</strong>
          </div>
          <span className="pcard__vars">
            {p.total_variantes} var.
          </span>
        </div>
      </div>

      <div className="pcard__glow" />
    </article>
  );
}

/* ══ PORTFOLIO CARD ═══════════════════════════════════════════ */
function PortfolioCard({ item, idx }) {
  const [hovered, setHovered] = useState(false);
  const img = item.imagen_url?.startsWith('http')
    ? item.imagen_url
    : item.imagen_url ? `http://localhost:5000${item.imagen_url}` : null;

  return (
    <article
      className={`pfcard ${hovered ? 'pfcard--hovered' : ''}`}
      style={{ '--delay': `${idx * 0.1}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="pfcard__media">
        {img
          ? <img src={img} alt={item.descripcion || 'Trabajo'} loading="lazy" />
          : <div className="pfcard__no-img">🖼️</div>
        }
        <div className="pfcard__overlay">
          {item.producto_nombre && (
            <span className="pfcard__product">{item.producto_nombre}</span>
          )}
        </div>
      </div>
      {item.descripcion && (
        <div className="pfcard__body">
          <p>{item.descripcion}</p>
        </div>
      )}
    </article>
  );
}

/* ══ LOADING ══════════════════════════════════════════════════ */
function LoadingHome() {
  return (
    <div className="home-page">
      <div className="home-skeleton-hero" />
      <div className="home-section">
        <div className="home-grid home-grid--products">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="home-skeleton-card" style={{ '--delay': `${i * 0.07}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}