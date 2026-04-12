import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css';

const API_URL = import.meta.env.VITE_API_URL;

const Mision = () => {
  const [mision, setMision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/public/mision`)
      .then(res => res.json())
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