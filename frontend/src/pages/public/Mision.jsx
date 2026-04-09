import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; 
import Footer from '../../components/Footer';

const Mision = () => {
  const [mision, setMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Definimos la URL usando la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // ✅ 2. Reemplazamos la URL fija por la variable con backticks (`)
    fetch(`${API_URL}/api/public/mision`) 
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener la misión');
        return res.json();
      })
      .then(data => {
        console.log('Respuesta:', data);
        const descripcion = data.descripcion || data.data?.descripcion;
        const fecha = data.fecha_creacion || data.data?.fecha_creacion;
        
        if (descripcion) {
          setMision({ descripcion, fecha });
        } else {
          setError('No se encontró la misión');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]); // Agregamos API_URL a las dependencias por buena práctica

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <>
      <div className="mision-container">
        <h1>Misión</h1>
        <p>{mision?.descripcion}</p>
        {mision?.fecha && (
          <div className="fecha">
            Última actualización: {new Date(mision.fecha).toLocaleDateString()}
          </div>
        )}
        <div style={{ marginTop: '20px' }}>
          <Link to="/" className="btn-volver">Volver al inicio</Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Mision;