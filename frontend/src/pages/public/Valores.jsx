import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/public/Mision.css'; 
import Footer from '../../components/Footer';

const Valores = () => {
  const [valores, setValores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 1. Usamos la variable de entorno para la URL
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    // ✅ 2. Cambiamos localhost por la variable dinámica
    fetch(`${API_URL}/api/public/valores`)
      .then(res => {
        if (!res.ok) throw new Error('Error al conectar con el servidor');
        return res.json();
      })
      .then(data => {
        // Adaptamos a la estructura de datos (por si viene envuelto en .data)
        const listaValores = Array.isArray(data) ? data : (data.data || []);
        
        if (listaValores.length > 0) {
          setValores(listaValores);
        } else {
          setError('No se encontraron valores');
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading) return <div className="mision-container loading">Cargando...</div>;
  if (error) return <div className="mision-container error">Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="mision-container" style={{ flex: 1 }}>
        <h1>Nuestros Valores</h1>
        
        {valores.map((valor, index) => (
          <div key={valor.id || index} className="valor-item" style={{ marginBottom: '24px' }}>
            <p><strong>{valor.valor}</strong></p>
            <p>{valor.descripcion}</p>
            {valor.fecha_creacion && (
              <p className="fecha">
                Última actualización: {new Date(valor.fecha_creacion).toLocaleDateString()}
              </p>
            )}
            <hr style={{ opacity: 0.1, marginTop: '10px' }} />
          </div>
        ))}
        
        <div style={{ marginTop: '30px' }}>
          <Link to="/" className="btn-volver">Volver al inicio</Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Valores;