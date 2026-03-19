import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../styles/public/Home.css';

const API = 'http://localhost:5000';

const Home = () => {
  const [productos, setProductos] = useState([]);
  const [portafolio, setPortafolio] = useState([]);
  const [mision, setMision] = useState(null);
  const [vision, setVision] = useState(null);
  const [valores, setValores] = useState([]);
  const [antecedentes, setAntecedentes] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingNos, setLoadingNos] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resPort] = await Promise.all([
          axios.get(`${API}/api/public/catalogo`),
          axios.get(`${API}/api/public/portafolio`),
        ]);
        setProductos(resProd.data);
        setPortafolio(resPort.data);
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchNosotros = async () => {
      try {
        const [resMision, resVision, resValores, resAntecedentes] = await Promise.allSettled([
          fetch(`${API}/api/public/mision`).then(r => r.json()),
          fetch(`${API}/api/public/vision`).then(r => r.json()),
          fetch(`${API}/api/public/valores`).then(r => r.json()),
          fetch(`${API}/api/public/antecedentes`).then(r => r.json()),
        ]);

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
          setValores(Array.isArray(d) ? d : (d ? [d] : []));
        }
        if (resAntecedentes.status === 'fulfilled') {
          const d = resAntecedentes.value?.data ?? resAntecedentes.value;
          setAntecedentes(Array.isArray(d) ? d : (d ? [d] : []));
        }
      } catch (err) {
        console.error('Error en fetchNosotros:', err);
      } finally {
        setLoadingNos(false);
      }
    };

    fetchData();
    fetchNosotros();

    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, []);

  const variantesFlat = productos.flatMap(prod =>
    prod.variantes?.length > 0
      ? prod.variantes.map(v => ({
          id: v.variante_id,
          nombre: prod.nombre,
          precio_final: Number(prod.precio_base) + Number(v.precio_adicional || 0),
          imagen_url: v.imagen_url,
          color: v.color,
          atributos: v.atributos || [],
        }))
      : [{
          id: prod.id,
          nombre: prod.nombre,
          precio_final: Number(prod.precio_base),
          imagen_url: '/placeholder.png',
          color: null,
          atributos: [],
        }]
  );

  return (
    <main className="home-container">

      {/* SECCIÓN HERO (opcional, la puedes agregar) */}
      <section className="hero">
        <h1 className="hero-title">Bienvenido a Nova Graf</h1>
        <p className="hero-subtitle">Descubre productos únicos y personalizados que reflejan tu esencia.</p>
        <Link to="/catalogo" className="btn">Explorar catálogo</Link>
      </section>

      {/* PASO 1: CATÁLOGO */}
      <section id="catalogo" className="home-section">
        <h2 className="step-title">
          <span>PASO 1:</span> ELIGE TU PRODUCTO BASE
        </h2>
        {loading ? (
          <p className="empty-message">Cargando productos...</p>
        ) : variantesFlat.length === 0 ? (
          <p className="empty-message">No hay productos disponibles por el momento.</p>
        ) : (
          <div className="scroll-row">
            {variantesFlat.map((item, index) => {
              const key = `v-${item.id}-${index}`;
              return (
                <div
                  key={key}
                  className="card"
                  onMouseEnter={() => setHoveredCard(key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="card-image-wrapper">
                    <img
                      src={item.imagen_url || '/placeholder.png'}
                      alt={`${item.nombre} ${item.color || ''}`}
                      className="card-image"
                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                  </div>
                  <h3 className="card-title">{item.nombre}</h3>
                  {item.color && <p className="card-color">{item.color}</p>}
                  {item.atributos.length > 0 && (
                    <p className="card-attributes">
                      {item.atributos.map(a => `${a.tipo}: ${a.valor}`).join(' · ')}
                    </p>
                  )}
                  <p className="card-price">${item.precio_final.toLocaleString('es-MX')}</p>
                  {hoveredCard === key && <button className="card-btn">Ver detalles</button>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PASO 2: PORTAFOLIO */}
      <section id="portafolio" className="home-section">
        <h2 className="step-title">
          <span>PASO 2:</span> ASÍ LO PODEMOS PERSONALIZAR
        </h2>
        {loading ? (
          <p className="empty-message">Cargando portafolio...</p>
        ) : portafolio.length === 0 ? (
          <p className="empty-message">No hay ejemplos de portafolio disponibles.</p>
        ) : (
          <div className="scroll-row">
            {portafolio.map((item, index) => {
              const key = `f-${item.id}`;
              return (
                <div
                  key={key}
                  className="card"
                  onMouseEnter={() => setHoveredCard(key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="card-image-wrapper">
                    <img
                      src={item.imagen_url || '/placeholder.png'}
                      alt={item.descripcion || 'portafolio'}
                      className="card-image"
                      onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                  </div>
                  <h3 className="card-title">{item.descripcion?.substring(0, 60) || '—'}</h3>
                  {item.producto_nombre && <p className="card-color">{item.producto_nombre}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* NOSOTROS: MISIÓN, VISIÓN, VALORES, ANTECEDENTES (vertical) */}
      <section id="nosotros" className="home-section">
        <h2 className="section-title">Conoce nuestra esencia</h2>

        {loadingNos ? (
          <p className="empty-message">Cargando información...</p>
        ) : (
          <div className="nosotros-stack">

            {/* Misión */}
            <div id="mision" className="nosotros-card animate-fadeInUp">
              <span className="tag">Misión</span>
              <p className="nosotros-text">
                {mision?.descripcion || 'Sin información registrada.'}
              </p>
            </div>

            {/* Visión */}
            <div id="vision" className="nosotros-card animate-fadeInUp">
              <span className="tag">Visión</span>
              <p className="nosotros-text">
                {vision?.descripcion || 'Sin información registrada.'}
              </p>
            </div>

            {/* Valores */}
            <div id="valores" className="nosotros-card animate-fadeInUp">
              <span className="tag">Valores</span>
              {valores.length === 0 ? (
                <p className="nosotros-text">Sin información registrada.</p>
              ) : (
                <ul className="valores-list">
                  {valores.map((v, i) => (
                    <li key={i} className="valores-item">
                      <span className="valor-bullet">●</span>
                      <span className="nosotros-text">
                        {v.descripcion || v.valor || v.nombre || v.texto || JSON.stringify(v)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Antecedentes - Timeline */}
            <div id="antecedentes" className="timeline-container">
              <span className="tag">Antecedentes</span>
              {antecedentes.length === 0 ? (
                <p className="nosotros-text">Sin información registrada.</p>
              ) : (
                <div className="timeline">
                  {antecedentes.map((item, index) => (
                    <div
                      key={item.id ?? index}
                      className="timeline-item animate-timelineItem"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="timeline-dot" />
                      {index < antecedentes.length - 1 && <div className="timeline-line" />}
                      <div className="timeline-content">
                        {item.fecha_evento && (
                          <span className="timeline-fecha">
                            {new Date(item.fecha_evento).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long'
                            })}
                          </span>
                        )}
                        <p className="timeline-desc">
                          {item.descripcion || item.texto || JSON.stringify(item)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </section>

      {/* CTA FINAL (opcional) */}
      <section className="cta-final">
        <h2>¿Listo para empezar?</h2>
        <p>Contáctanos y personaliza tus productos hoy mismo.</p>
        <Link to="/contacto" className="btn btn-gold">Solicitar información</Link>
      </section>

    </main>
  );
};

export default Home;