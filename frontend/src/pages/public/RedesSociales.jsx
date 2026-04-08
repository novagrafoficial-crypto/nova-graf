import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; // Ajusta la ruta según tu estructura
import Footer from '../../components/Footer';
const RedesSociales = () => {
  const [redes, setRedes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/redes-sociales') // o usa proxy
      .then(res => res.json())
      .then(data => {
        console.log('Respuesta:', data);
        // Extrae la descripción según la estructura real
        const red_social = data.red_social || data.data?.red_social;
        const url_red_social = data.url_red_social || data.data?.url_red_social;
        if (red_social) {
          setRedes({ red_social, url_red_social });
        } else {
          setError('No se encontró redes sociales');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <div className="mision-container">
      <h1>Redes Sociales</h1>
      <p>{redes?.red_social}</p>
      {redes?.url_red_social && (
        <div className="fecha">
          Última actualización: {new Date(redes.url_red_social).toLocaleDateString()}
        </div>
      )}
      <Link to="/">Volver al inicio</Link>
    </div>
    
  );
  
};

export default RedesSociales;