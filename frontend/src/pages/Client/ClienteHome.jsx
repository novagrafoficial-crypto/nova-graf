import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import "../../styles/client/ClientHome.css";

function ClienteHome() {
  const navigate = useNavigate();
  const context = useOutletContext();
  const { user } = context || {};

  // Estados para datos
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [portafolio, setPortafolio] = useState([]);
  const [catActiva, setCatActiva] = useState("todas");
  const [loading, setLoading] = useState(true);
  
  // Refs para animaciones
  const heroRef = useRef(null);
  const canvasRef = useRef(null);

  // Filtrar productos por categoría
  const productosFiltrados = catActiva === "todas" 
    ? productos 
    : productos.filter(p => p.categoria_nombre?.toLowerCase() === catActiva);

  // Cargar datos
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar categorías
        const resCats = await fetch('http://localhost:5000/api/client/categorias');
        const catsData = await resCats.json();
        setCategorias(Array.isArray(catsData) ? catsData : []);

        // Cargar productos
        const resProds = await fetch('http://localhost:5000/api/client/productos');
        const prodsData = await resProds.json();
        setProductos(Array.isArray(prodsData) ? prodsData : []);

        // Cargar portafolio
        const resPort = await fetch('http://localhost:5000/api/client/portafolio');
        const portData = await resPort.json();
        setPortafolio(Array.isArray(portData) ? portData : []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // Animación del canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animación simple
    let time = 0;
    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;
      
      // Dibujar partículas decorativas
      for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i) * 0.5 + 0.5) * canvas.width;
        const y = (Math.cos(time * 0.8 + i) * 0.5 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(53, 186, 153, ${0.1 + Math.sin(time + i) * 0.05})`;
        ctx.fill();
      }
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  if (!user) {
    return (
      <div className="home-loading">
        <p>Cargando información del usuario...</p>
      </div>
    );
  }

  const cards = [
    { icon: "📦", title: "Mis Pedidos", desc: "Revisa el estado de tus pedidos", ruta: "/cliente/pedidos" },
    { icon: "🛒", title: "Mi Carrito", desc: "Productos agregados", ruta: "/cliente/carrito" },
    { icon: "👤", title: "Mi Perfil", desc: "Gestiona tu información", ruta: "/cliente/perfil" },
  ];

  return (
    <div className="cliente-home">
      {/* Header de bienvenida */}
      <div className="home-welcome">
        <h1>Bienvenido, {user.nombre || user.nombre_usuario || 'Cliente'} 👋</h1>
        <p>¿Qué deseas hacer hoy?</p>
      </div>

      {/* Tarjetas de acceso rápido */}
      <div className="home-cards-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="home-card" onClick={() => navigate(card.ruta)}>
            <div className="home-card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </div>
        ))}
      </div>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="home-hero">
        <div className="home-hero__bg" ref={heroRef} />
        <canvas ref={canvasRef} className="home-hero__canvas" />

        <div className="home-hero__blob home-hero__blob--1" />
        <div className="home-hero__blob home-hero__blob--2" />
        <div className="home-hero__ring home-hero__ring--1" />
        <div className="home-hero__ring home-hero__ring--2" />

        <div className="home-hero__content">
          <span className="home-hero__chip">🖨️ Personalización</span>

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

        <div className="home-hero__scroll-hint">
          <span>scroll</span>
          <div className="home-hero__scroll-line" />
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
                  <span className="home-cat__count">{c.total_productos || 0}</span>
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
            {loading ? (
              <p className="home-empty">Cargando productos...</p>
            ) : productosFiltrados.length === 0 ? (
              <p className="home-empty">Sin productos en esta categoría.</p>
            ) : (
              productosFiltrados.map((p, i) => (
                <ProductCard
                  key={p.id}
                  producto={p}
                  idx={i}
                  onClick={() => navigate(`/cliente/producto/${p.id}`)}
                />
              ))
            )}
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
            <span className="home-banner__label">🖨️ Personalización</span>
            <h2>¿Tienes una idea<br />en mente?</h2>
            <p>Elige un producto, sube tu diseño o pídenos uno desde cero. Nuestro equipo lo hace realidad.</p>
            <button className="home-cta home-cta--white"
              onClick={() => navigate('/cliente/catalogo')}>
              <span>Comenzar proyecto</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="home-banner__icons">
            <div className="home-banner-icon">🎨</div>
            <div className="home-banner-icon">🖌️</div>
            <div className="home-banner-icon">✨</div>
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

        {loading ? (
          <div className="home-empty-state">
            <p>Cargando portafolio...</p>
          </div>
        ) : portafolio.length === 0 ? (
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

      {/* ══ INFORMACIÓN DEL USUARIO ════════════════════════════ */}
      <div className="home-user-info">
        <h3>Tu cuenta</h3>
        <div className="home-user-details">
          <p><strong>📧 Correo:</strong> {user.correo_electronico || user.email}</p>
          <p><strong>👤 Rol:</strong> {user.rol || 'Cliente'}</p>
          <p><strong>📅 Miembro desde:</strong> {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
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

      <div className="pcard__info">
        <h3 className="pcard__title">{p.nombre}</h3>
        <p className="pcard__desc">{p.descripcion?.slice(0, 80)}...</p>
        <div className="pcard__footer">
          <span className="pcard__price">${precio.toFixed(2)}</span>
          <span className="pcard__arrow">→</span>
        </div>
      </div>
    </article>
  );
}

/* ══ PORTFOLIO CARD ══════════════════════════════════════════ */
function PortfolioCard({ item, idx }) {
  const [hovered, setHovered] = useState(false);
  const img = item.imagen_url?.startsWith('http')
    ? item.imagen_url
    : item.imagen_url ? `http://localhost:5000${item.imagen_url}` : null;

  return (
    <div
      className={`port-card ${hovered ? 'port-card--hovered' : ''}`}
      style={{ '--delay': `${idx * 0.08}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="port-card__media">
        {img
          ? <img src={img} alt={item.titulo} loading="lazy" />
          : <div className="port-card__no-img">🎨</div>
        }
        <div className="port-card__overlay">
          <span className="port-card__title">{item.titulo}</span>
          {item.descripcion && <p>{item.descripcion.slice(0, 60)}...</p>}
        </div>
      </div>
    </div>
  );
}

export default ClienteHome;