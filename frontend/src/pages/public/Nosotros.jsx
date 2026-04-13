// frontend/src/pages/public/Nosotros.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Nosotros.css';

const Nosotros = () => {
  const [mision, setMision] = useState(null);
  const [vision, setVision] = useState(null);
  const [valores, setValores] = useState([]);
  const [antecedentes, setAntecedentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resMision, resVision, resValores, resAntecedentes] = await Promise.allSettled([
          fetch('/api/public/mision').then(r => r.json()),
          fetch('/api/public/vision').then(r => r.json()),
          fetch('/api/public/valores').then(r => r.json()),
          fetch('/api/public/antecedentes').then(r => r.json())
        ]);

        // Misión
        if (resMision.status === 'fulfilled') {
          const data = resMision.value;
          setMision(data?.data ?? data);
        }

        // Visión
        if (resVision.status === 'fulfilled') {
          const data = resVision.value;
          setVision(data?.data ?? data);
        }

        // Valores
        if (resValores.status === 'fulfilled') {
          let data = resValores.value?.data ?? resValores.value;
          setValores(Array.isArray(data) ? data : (data ? [data] : []));
        }

        // Antecedentes
        if (resAntecedentes.status === 'fulfilled') {
          let data = resAntecedentes.value;
          // Soporta diferentes estructuras de respuesta
          if (data?.antecedentes) data = data.antecedentes;
          else if (data?.data) data = data.data;
          setAntecedentes(Array.isArray(data) ? data : []);
        } else {
          console.error('Error al cargar antecedentes:', resAntecedentes.reason);
          setAntecedentes([]);
        }
      } catch (error) {
        console.error('Error general:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="nosotros-container">
        <div className="nosotros-hero">
          <h1>Nuestra historia</h1>
          <p>Conoce quiénes somos, qué nos mueve y el camino que hemos recorrido.</p>
        </div>
        <div className="ng-loader">Cargando información...</div>
      </div>
    );
  }

  return (
    <div className="nosotros-container">
      {/* Hero */}
      <div className="nosotros-hero">
        <h1>Nuestra historia</h1>
        <p>Conoce quiénes somos, qué nos mueve y el camino que hemos recorrido.</p>
      </div>

      {/* Misión y Visión */}
      <section className="ng-section">
        <div className="ng-section__head">
          <div className="ng-section__label">Propósito</div>
          <h2 className="ng-section__title">Nuestra misión y visión</h2>
        </div>
        <div className="nosotros-mv-row">
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
      </section>

      {/* Valores */}
      {valores.length > 0 && (
        <section className="ng-section">
          <div className="ng-section__head">
            <div className="ng-section__label">Principios</div>
            <h2 className="ng-section__title">Nuestros valores</h2>
            <p className="ng-section__sub">Los pilares que guían cada uno de nuestros proyectos.</p>
          </div>
          <div className="valores-grid">
            {valores.map((valor, idx) => (
              <div key={idx} className="valor-card">
                <div className="valor-card__icon">✨</div>
                <h3 className="valor-card__title">{valor.titulo || valor.nombre || 'Valor'}</h3>
                <p className="valor-card__text">{valor.descripcion || valor.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Antecedentes (línea de tiempo) */}
      <section className="ng-section">
        <div className="ng-section__head">
          <div className="ng-section__label">Recorrido</div>
          <h2 className="ng-section__title">Nuestra historia</h2>
          <p className="ng-section__sub">Hitos importantes en el camino de Nova Graf.</p>
        </div>
        {antecedentes.length === 0 ? (
          <div className="no-data-message">
            <p>Pronto compartiremos los momentos más importantes de nuestra historia.</p>
          </div>
        ) : (
          <div className="timeline">
            {antecedentes.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-date">
                    {new Date(item.fecha_evento).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}
                  </div>
                  <p className="timeline-desc">{item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Nosotros;