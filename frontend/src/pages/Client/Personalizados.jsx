// src/pages/client/Personalizados.jsx
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import '../../styles/client/Personalizados.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function Personalizados() {
  const { user } = useOutletContext() || {};
  const [personalizados, setPersonalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [catActiva, setCatActiva] = useState('todas');

  useEffect(() => {
    // Aquí asumo que tienes un endpoint que devuelve los trabajos personalizados
    // Si no, podrías usar el mismo endpoint de portafolio pero filtrando
    fetch(`${API_URL}/api/client/personalizados`)
      .then(r => r.json())
      .then(data => {
        setPersonalizados(data.personalizados || []);
        setCategorias(data.categorias || []);
      })
      .catch(err => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = catActiva === 'todas' 
    ? personalizados 
    : personalizados.filter(p => p.categoria?.toLowerCase() === catActiva.toLowerCase());

  if (loading) return <div className="personalizados-loading">Cargando...</div>;

  return (
    <div className="personalizados-page">
      <div className="personalizados-header">
        <h1>✨ Trabajos Personalizados</h1>
        <p>Descubre nuestros proyectos realizados para clientes como tú</p>
      </div>

      {/* Filtros por categoría */}
      <div className="personalizados-filtros">
        <button 
          className={`filtro-btn ${catActiva === 'todas' ? 'active' : ''}`}
          onClick={() => setCatActiva('todas')}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button 
            key={cat}
            className={`filtro-btn ${catActiva === cat.toLowerCase() ? 'active' : ''}`}
            onClick={() => setCatActiva(cat.toLowerCase())}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de personalizados */}
      <div className="personalizados-grid">
        {filtrados.length === 0 ? (
          <div className="personalizados-empty">
            <span>🔍</span>
            <p>No hay trabajos en esta categoría</p>
          </div>
        ) : (
          filtrados.map((item, i) => (
            <PersonalizadoCard key={item.id} item={item} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

// Componente Card para cada trabajo personalizado
function PersonalizadoCard({ item, index }) {
  const [hovered, setHovered] = useState(false);
  
  const img = item.imagen_url?.startsWith('http')
    ? item.imagen_url
    : item.imagen_url ? `${API_URL}${item.imagen_url}` : null;

  return (
    <div 
      className="personalizado-card"
      style={{ animationDelay: `${index * 0.1}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="personalizado-card__media">
        {img ? (
          <img src={img} alt={item.titulo || 'Trabajo personalizado'} loading="lazy" />
        ) : (
          <div className="personalizado-card__placeholder">🎨</div>
        )}
        {item.categoria && (
          <span className="personalizado-card__tag">{item.categoria}</span>
        )}
        <div className={`personalizado-card__overlay ${hovered ? 'visible' : ''}`}>
          <button className="personalizado-card__btn">Ver detalles</button>
        </div>
      </div>
      
      <div className="personalizado-card__body">
        <h3>{item.titulo || 'Trabajo personalizado'}</h3>
        {item.descripcion && <p>{item.descripcion}</p>}
        {item.cliente && (
          <span className="personalizado-card__cliente">👤 {item.cliente}</span>
        )}
      </div>
    </div>
  );
}