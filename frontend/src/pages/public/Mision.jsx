import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; // Ajusta la ruta según tu estructura
import Footer from '../../components/Footer';
const Mision = () => {
  const [mision, setMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/mision') // o usa proxy
      .then(res => res.json())
      .then(data => {
        console.log('Respuesta:', data);
        // Extrae la descripción según la estructura real
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
  }, []);

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <div className="mision-container">
      <h1>Misión</h1>
      <p>{mision?.descripcion}</p>
      {mision?.fecha && (
        <div className="fecha">
          Última actualización: {new Date(mision.fecha).toLocaleDateString()}
        </div>
      )}
      <Link to="/">Volver al inicio</Link>
    </div>
    
  );
  
};

export default Mision;