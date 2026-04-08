import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; // Ajusta la ruta según tu estructura
import Footer from '../../components/Footer';

const Valores = () => {
  const [valores, setValores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/public/valores')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setValores(data); // ahora guardamos todo el array
        } else {
          setError('No se encontraron valores');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <div className="mision-container">
      <h1>Valores</h1>
      {valores.map(valor => (
        <div key={valor.id} className="valor-item">
          <p><strong>{valor.valor}</strong></p>
          <p>{valor.descripcion}</p>
          <p className="fecha">
            Última actualización: {new Date(valor.fecha_creacion).toLocaleDateString()}
          </p>
        </div>
      ))}
      <Link to="/">Volver al inicio</Link>
      <Footer />
    </div>
  );
};

export default Valores;