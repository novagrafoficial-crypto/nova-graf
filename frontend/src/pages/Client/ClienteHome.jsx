import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import "../../styles/client/ClientHome.css";

const API_BASE = import.meta.env.VITE_API_URL;

function ClienteHome() {
  const context = useOutletContext();
  const navigate = useNavigate();
  const [destacados, setDestacados] = useState([]);
  const [misDisenos, setMisDisenos] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = context || {};

  // Cargar productos personalizados destacados (ejemplos)
  useEffect(() => {
    fetch(`${API_BASE}/api/personalizados/destacados`)
      .then(r => r.json())
      .then(data => setDestacados(Array.isArray(data) ? data : []))
      .catch(() => setDestacados([]))
      .finally(() => setLoading(false));
  }, []);

  // Si el usuario está logueado, cargar sus propios diseños
  useEffect(() => {
    if (user) {
      fetch(`${API_BASE}/api/usuario/mis-personalizaciones`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // ajusta según tu auth
      })
        .then(r => r.json())
        .then(data => setMisDisenos(Array.isArray(data) ? data : []))
        .catch(() => setMisDisenos([]));
    }
  }, [user]);

  const irACatalogo = () => navigate('/cliente/catalogo');

  return (
    <div className="ch-home">
      {/* Hero principal */}
      <section className="ch-hero">
        <div className="ch-hero__content">
          <h1 className="ch-hero__title">Crea productos únicos con tu estilo</h1>
          <p className="ch-hero__subtitle">
            Elige entre nuestra amplia variedad de productos base y personalízalos a tu gusto.
            Camisetas, tazas, gorras, y mucho más.
          </p>
          <button className="ch-hero__button" onClick={irACatalogo}>
            Comenzar a personalizar →
          </button>
        </div>
        <div className="ch-hero__image">
          {/* Puedes poner una imagen ilustrativa */}
          <img src="/hero-personalizacion.jpg" alt="Personalización" />
        </div>
      </section>

      {/* Sección: Productos personalizados destacados (inspiración) */}
      {!loading && destacados.length > 0 && (
        <section className="ch-section">
          <div className="ch-section__header">
            <h2>✨ Ideas que inspiran</h2>
            <p>Mira cómo otros han personalizado sus productos</p>
          </div>
          <div className="ch-scroll-horizontal">
            {destacados.map(item => (
              <div key={item.id} className="ch-card-inspiracion" onClick={() => navigate(`/personalizado/${item.id}`)}>
                <img src={item.imagen_url} alt={item.nombre} />
                <div className="ch-card-inspiracion__info">
                  <h4>{item.nombre}</h4>
                  {item.usuario_nombre && <span>por {item.usuario_nombre}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección: Tus últimos diseños (solo si el usuario tiene) */}
      {user && misDisenos.length > 0 && (
        <section className="ch-section">
          <div className="ch-section__header">
            <h2>🔄 Tus creaciones</h2>
            <button className="ch-section__link" onClick={() => navigate('/cliente/mis-disenos')}>
              Ver todos →
            </button>
          </div>
          <div className="ch-scroll-horizontal">
            {misDisenos.slice(0, 6).map(d => (
              <div key={d.id} className="ch-card-mini" onClick={() => navigate(`/personalizado/${d.id}`)}>
                <img src={d.imagen_url} alt={d.nombre} />
                <p>{d.nombre}</p>
                <small>{new Date(d.fecha_creacion).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección: Categorías populares (enlaces rápidos al catálogo con filtro) */}
      <section className="ch-categorias-populares">
        <h2>Explora por categoría</h2>
        <div className="ch-categorias-grid">
          <button onClick={() => navigate('/cliente/catalogo?categoria=1')}>👕 Camisetas</button>
          <button onClick={() => navigate('/cliente/catalogo?categoria=2')}>☕ Tazas</button>
          <button onClick={() => navigate('/cliente/catalogo?categoria=3')}>🧢 Gorras</button>
          <button onClick={() => navigate('/cliente/catalogo?categoria=4')}>📱 Fundas</button>
        </div>
      </section>

      {/* Llamada a la acción final */}
      <section className="ch-cta">
        <div className="ch-cta__content">
          <h2>¿Listo para crear algo único?</h2>
          <p>Selecciona el producto base y dale tu toque personal.</p>
          <button onClick={irACatalogo} className="ch-cta__button">
            Ir al catálogo
          </button>
        </div>
      </section>
    </div>
  );
}

export default ClienteHome;