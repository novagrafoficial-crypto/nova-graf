import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Vision.css'; // Ajusta la ruta según tu estructura

const Vision = () => {
  const [vision, setVision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/vision') // o usa proxy
      .then(res => res.json())
      .then(data => {
        console.log('Respuesta:', data);
        // Extrae la descripción según la estructura real
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
  }, []);

  if (loading) return <div className="vision-container loading">Cargando...</div>;
  if (error) return <div className="vision-container error">Error: {error}</div>;

  return (
    <div className="vision-container">
      <h1>Visión</h1>
      <p>{vision?.descripcion}</p>
      {vision?.fecha && (
        <div className="fecha">
          Última actualización: {new Date(vision.fecha).toLocaleDateString()}
        </div>
      )}
      <Link to="/">Volver al inicio</Link>
    </div>
  );
};

export default Vision;