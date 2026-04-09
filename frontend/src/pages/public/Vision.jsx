import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Vision.css'; 
import Footer from '../../components/Footer';

const Vision = () => {
  const [vision, setVision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Definimos la URL usando la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // ✅ 2. Reemplazamos localhost por la variable dinámica
    fetch(`${API_URL}/api/public/vision`)
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener la visión');
        return res.json();
      })
      .then(data => {
        console.log('Respuesta:', data);
        const descripcion = data.descripcion || data.data?.descripcion;
        const fecha = data.fecha_creacion || data.data?.fecha_creacion;
        
        if (descripcion) {
          setVision({ descripcion, fecha });
        } else {
          setError('No se encontró la visión');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading) return <div className="vision-container loading">Cargando...</div>;
  if (error) return <div className="vision-container error">Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="vision-container" style={{ flex: 1 }}>
        <h1>Visión</h1>
        <p>{vision?.descripcion}</p>
        
        {vision?.fecha && (
          <div className="fecha">
            Última actualización: {new Date(vision.fecha).toLocaleDateString()}
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <Link to="/" className="btn-volver">Volver al inicio</Link>
        </div>
      </div>
      
      {/* ✅ Agregamos el Footer para mantener consistencia */}
      <Footer />
    </div>
  );
};

export default Vision;