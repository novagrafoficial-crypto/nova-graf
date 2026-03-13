import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/public/Home.css';

const API = 'http://localhost:5000';

const Home = () => {
  const [productos, setProductos]     = useState([]);
  const [portafolio, setPortafolio]   = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

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
        console.error('Error cargando datos', error);
      }
    };
    fetchData();
  }, []);

  // ── Aplanar variantes: una card por color ──────────────────────
  const variantesFlat = productos.length > 0
    ? productos.flatMap(prod =>
        prod.variantes?.length > 0
          ? prod.variantes.map(v => ({
              id:          v.variante_id,
              nombre:      prod.nombre,
              precio_final: Number(prod.precio_base) + Number(v.precio_adicional || 0),
              imagen_url:  v.imagen_url,
              color:       v.color,
              atributos:   v.atributos || [],
            }))
          : [{
              id:          prod.id,
              nombre:      prod.nombre,
              precio_final: Number(prod.precio_base),
              imagen_url:  '/placeholder.png',
              color:       null,
              atributos:   [],
            }]
      )
    : [
        { id: 1, nombre: 'Playera de Algodón',  precio_final: 150, imagen_url: '/placeholder.png', color: null, atributos: [] },
        { id: 2, nombre: 'Termo de Acero',       precio_final: 210, imagen_url: '/placeholder.png', color: null, atributos: [] },
        { id: 3, nombre: 'Vaso de Vidrio',       precio_final: 80,  imagen_url: '/placeholder.png', color: null, atributos: [] },
      ];

  const portafolioBase = portafolio.length > 0 ? portafolio : [
    { id: 4, descripcion: 'Playera con Logo Personalizado', imagen_url: '/placeholder.png' },
    { id: 5, descripcion: 'Termo Grabado Láser',            imagen_url: '/placeholder.png' },
    { id: 6, descripcion: 'Vaso Sublimado a Full-Color',    imagen_url: '/placeholder.png' },
  ];

  const styles = {
    scrollContainer: {
      display: 'flex',
      overflowX: 'auto',
      gap: '24px',
      padding: '20px 0 30px 0',
      scrollbarWidth: 'thin',
      WebkitOverflowScrolling: 'touch',
    },
    card: {
      flex: '0 0 auto',
      width: '240px',
      textAlign: 'center',
      background: '#e0f2f1',
      borderRadius: '20px',
      padding: '20px 12px',
      boxShadow: '0 8px 20px rgba(0, 100, 100, 0.15)',
      cursor: 'pointer',
      border: '1px solid rgba(0,128,128,0.1)',
      animation: 'fadeInUp 0.6s ease-out both',
    },
    image: {
      width: '200px',
      height: '200px',
      objectFit: 'contain',
      display: 'block',
      margin: '0 auto 16px',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '12px',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03), 0 4px 12px rgba(0,80,80,0.08)',
    },
    title: {
      fontSize: '1rem',
      margin: '10px 0 4px',
      fontWeight: 600,
      color: '#00695c',
      letterSpacing: '-0.01em',
    },
    color: {
      fontSize: '0.85rem',
      color: '#00897b',
      margin: '2px 0',
      fontWeight: 500,
    },
    atributos: {
      fontSize: '0.78rem',
      color: '#607d8b',
      margin: '2px 0 6px',
    },
    price: {
      color: '#004d40',
      fontWeight: 700,
      fontSize: '1.1rem',
      margin: '6px 0 0',
    },
    stepTitle: {
      fontSize: '1.8rem',
      fontWeight: 300,
      margin: '40px 0 20px',
      color: '#006064',
      borderBottom: '2px solid #b2dfdb',
      paddingBottom: '8px',
    },
    stepSpan: {
      fontWeight: 700,
      color: '#00796b',
    },
    cta: {
      marginTop: '60px',
      textAlign: 'center',
      background: '#e0f2f1',
      padding: '40px 20px',
      borderRadius: '48px 48px 24px 24px',
      boxShadow: '0 -4px 20px rgba(0,80,80,0.1)',
    },
    ctaButton: {
      padding: '14px 36px',
      background: '#00796b',
      color: '#fff',
      border: 'none',
      borderRadius: '40px',
      fontSize: '1.2rem',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 8px 16px rgba(0,100,80,0.3)',
      transition: 'background 0.2s',
    },
  };

  return (
    <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* ── PASO 1: una card por variante de color ── */}
      <h2 style={styles.stepTitle}>
        <span style={styles.stepSpan}>PASO 1:</span> ELIGE TU PRODUCTO BASE
      </h2>
      <div style={styles.scrollContainer}>
        {variantesFlat.map((item, index) => (
          <div
            key={`v-${item.id}-${index}`}
            style={{
              ...styles.card,
              transform:   hoveredCard === `v-${item.id}-${index}` ? 'scale(1.04)' : 'scale(1)',
              boxShadow:   hoveredCard === `v-${item.id}-${index}`
                ? '0 16px 32px rgba(0, 130, 120, 0.28)'
                : styles.card.boxShadow,
              transition:     'transform 0.3s ease, box-shadow 0.3s ease',
              animationDelay: `${index * 0.07}s`,
            }}
            onMouseEnter={() => setHoveredCard(`v-${item.id}-${index}`)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <img
              src={item.imagen_url || '/placeholder.png'}
              alt={`${item.nombre} ${item.color || ''}`}
              style={styles.image}
              onError={(e) => { e.target.src = '/placeholder.png'; }}
            />
            <h3 style={styles.title}>{item.nombre}</h3>

            {item.color && (
              <p style={styles.color}>{item.color}</p>
            )}

            {item.atributos.length > 0 && (
              <p style={styles.atributos}>
                {item.atributos.map(a => `${a.tipo}: ${a.valor}`).join(' · ')}
              </p>
            )}

            <p style={styles.price}>
              ${item.precio_final.toLocaleString('es-MX')}
            </p>
          </div>
        ))}
      </div>

      {/* ── PASO 2: Portafolio ── */}
      <h2 style={styles.stepTitle}>
        <span style={styles.stepSpan}>PASO 2:</span> ASÍ LO PODEMOS PERSONALIZAR
      </h2>
      <div style={styles.scrollContainer}>
        {portafolioBase.map((item, index) => (
          <div
            key={`f-${item.id}`}
            style={{
              ...styles.card,
              transform:   hoveredCard === `f-${item.id}` ? 'scale(1.04)' : 'scale(1)',
              boxShadow:   hoveredCard === `f-${item.id}`
                ? '0 16px 32px rgba(0, 130, 120, 0.28)'
                : styles.card.boxShadow,
              transition:     'transform 0.3s ease, box-shadow 0.3s ease',
              animationDelay: `${index * 0.07}s`,
            }}
            onMouseEnter={() => setHoveredCard(`f-${item.id}`)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <img
              src={item.imagen_url || '/placeholder.png'}
              alt={item.descripcion || 'portafolio'}
              style={styles.image}
              onError={(e) => { e.target.src = '/placeholder.png'; }}
            />
            <h3 style={styles.title}>
              {item.descripcion ? item.descripcion.substring(0, 60) : '—'}
            </h3>
            {item.producto_nombre && (
              <p style={styles.color}>{item.producto_nombre}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <section style={styles.cta}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 300, color: '#004d40', marginBottom: '16px' }}>
          EMPIEZA A DISEÑAR TU PROPIO PRODUCTO
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#00695c', marginBottom: '32px' }}>
          Personaliza cada detalle y recibe una muestra gratis
        </p>
        <button
          style={styles.ctaButton}
          onMouseEnter={(e) => { e.target.style.background = '#00897b'; }}
          onMouseLeave={(e) => { e.target.style.background = '#00796b'; }}
        >
          COMENZAR
        </button>
      </section>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
};

export default Home;