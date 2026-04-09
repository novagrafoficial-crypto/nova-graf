import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; 
import Footer from '../../components/Footer';

const RedesSociales = () => {
  const [redes, setRedes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Usamos la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // ✅ 2. Cambiamos localhost por la variable dinámica
    fetch(`${API_URL}/api/public/redes-sociales`)
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then(data => {
        console.log('Respuesta:', data);
        
        // Ajustamos la extracción de datos según tu estructura
        const red_social = data.red_social || data.data?.red_social;
        const url_red_social = data.url_red_social || data.data?.url_red_social;

        if (red_social) {
          setRedes({ red_social, url_red_social });
        } else {
          setError('No se encontraron redes sociales');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <>
      <div className="mision-container">
        <h1>Redes Sociales</h1>
        <div style={{ marginBottom: '20px' }}>
          <p><strong>Plataforma:</strong> {redes?.red_social}</p>
          
          {redes?.url_red_social && (
            <p>
              <strong>Enlace:</strong>{' '}
              <a 
                href={redes.url_red_social} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#10b981', textDecoration: 'underline' }}
              >
                {redes.url_red_social}
              </a>
            </p>
          )}
        </div>

        <Link to="/" className="btn-volver">Volver al inicio</Link>
      </div>
      <Footer />
    </>
  );
};

export default RedesSociales;