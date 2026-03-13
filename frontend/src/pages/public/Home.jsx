import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/public/Home.css';

const API = 'http://localhost:5000';

const Home = () => {
  const [productos, setProductos] = useState([]);
  const [portafolio, setPortafolio] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resPort] = await Promise.all([
          axios.get(`${API}/api/public/productos`),
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

  const productosBase = productos.length > 0 ? productos : [
    { id: 1, nombre: 'Playera de Algodón Virgen', precio_base: 150, imagen_url: '/placeholder.png' },
    { id: 2, nombre: 'Termo de Acero en Blanco', precio_base: 210, imagen_url: '/placeholder.png' },
    { id: 3, nombre: 'Vaso de Vidrio Satinado', precio_base: 80, imagen_url: '/placeholder.png' },
  ];

  const portafolioBase = portafolio.length > 0 ? portafolio : [
    { id: 4, descripcion: 'Playera con Logo Personalizado', imagen_url: '/placeholder.png' },
    { id: 5, descripcion: 'Termo Grabado Láser', imagen_url: '/placeholder.png' },
    { id: 6, descripcion: 'Vaso Sublimado a Full-Color', imagen_url: '/placeholder.png' },
  ];

  const styles = {
    scrollContainer: {
      display: 'flex',
      overflowX: 'auto',
      gap: '24px',
      padding: '20px 0 30px 0',
      scrollbarWidth: 'thin',
      WebkitOverflowScrolling: 'touch',
      // Sombra interior para indicar scroll
      background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.02) 2%, transparent 98%)',
    },
    card: {
      flex: '0 0 auto',
      width: '260px',
      textAlign: 'center',
      background: '#e0f2f1', // verde aqua suave
      borderRadius: '20px',
      padding: '20px 12px',
      boxShadow: '0 8px 20px rgba(0, 100, 100, 0.15)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      animation: 'fadeInUp 0.6s ease-out',
      cursor: 'pointer',
      border: '1px solid rgba(0,128,128,0.1)',
    },
    image: {
      width: '240px',
      height: '240px',
      objectFit: 'contain',
      display: 'block',
      margin: '0 auto 16px',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '12px',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.03), 0 4px 12px rgba(0,80,80,0.1)',
      transition: 'transform 0.3s ease',
    },
    title: {
      fontSize: '1.2rem',
      margin: '12px 0 6px',
      fontWeight: 600,
      color: '#00695c',
      letterSpacing: '-0.01em',
    },
    price: {
      color: '#004d40',
      fontWeight: 700,
      fontSize: '1.3rem',
      margin: '4px 0',
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
      animation: 'fadeIn 1s ease',
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
      transition: 'background 0.2s, transform 0.1s',
    },
  };

  // Para manejar hover (se puede con :hover en CSS, pero aquí simulamos con eventos onMouse)
  // Como usamos estilos en línea, necesitamos estado para hover. 
  // Pero lo podemos hacer con CSS clase aparte. Para simplificar, agregamos un pequeño script inline style con :hover no es posible.
  // Lo recomendable es mover estos estilos a una hoja CSS y usar clases.
  // Sin embargo, te muestro cómo hacerlo con un estado local simple si quieres mantener todo en JS.

  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <main style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* PASO 1 */}
      <h2 style={styles.stepTitle}>
        <span style={styles.stepSpan}>PASO 1:</span> ELIGE TU PRODUCTO BASE
      </h2>
      <div style={styles.scrollContainer}>
        {productosBase.map((prod, index) => (
          <div
            key={prod.id}
            style={{
              ...styles.card,
              transform: hoveredCard === `p-${prod.id}` ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hoveredCard === `p-${prod.id}` ? '0 15px 30px rgba(0, 130, 120, 0.25)' : styles.card.boxShadow,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              animationDelay: `${index * 0.1}s`, // escalonado
            }}
            onMouseEnter={() => setHoveredCard(`p-${prod.id}`)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <img
              src={prod.imagen_url || '/placeholder.png'}
              alt={prod.nombre}
              style={styles.image}
              onError={(e) => { e.target.src = '/placeholder.png'; }}
            />
            <h3 style={styles.title}>{prod.nombre}</h3>
            {prod.precio_base && (
              <p style={styles.price}>${Number(prod.precio_base).toLocaleString('es-MX')}</p>
            )}
          </div>
        ))}
      </div>

      {/* PASO 2 */}
      <h2 style={styles.stepTitle}>
        <span style={styles.stepSpan}>PASO 2:</span> ASÍ LO PODEMOS PERSONALIZAR (PORTAFOLIO)
      </h2>
      <div style={styles.scrollContainer}>
        {portafolioBase.map((item, index) => (
          <div
            key={item.id}
            style={{
              ...styles.card,
              transform: hoveredCard === `f-${item.id}` ? 'scale(1.03)' : 'scale(1)',
              boxShadow: hoveredCard === `f-${item.id}` ? '0 15px 30px rgba(0, 130, 120, 0.25)' : styles.card.boxShadow,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              animationDelay: `${index * 0.1}s`,
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
            {item.producto_nombre && <p style={{ color: '#00695c', fontSize: '0.95rem' }}>{item.producto_nombre}</p>}
          </div>
        ))}
      </div>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 300, color: '#004d40', marginBottom: '16px' }}>
          EMPIEZA A DISEÑAR TU PROPIO PRODUCTO
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#00695c', marginBottom: '32px' }}>
          Personaliza cada detalle y recibe una muestra gratis
        </p>
        <button
          style={styles.ctaButton}
          onMouseEnter={(e) => e.target.style.background = '#00897b'}
          onMouseLeave={(e) => e.target.style.background = '#00796b'}
        >
          COMENZAR
        </button>
      </section>

      {/* Agregar keyframes para animaciones (debe estar en tu CSS global) */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </main>
  );
};

export default Home;