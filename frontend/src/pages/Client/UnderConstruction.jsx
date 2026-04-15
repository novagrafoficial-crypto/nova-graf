import React from 'react';
import { Link } from 'react-router-dom';


const UnderConstruction = () => {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1>🚧 Sección en construcción</h1>
      <p>Estamos trabajando para traerte las mejores ofertas. ¡Pronto estarán disponibles!</p>
      <Link to="/cliente/home" style={{ display: 'inline-block', marginTop: '2rem', padding: '0.8rem 1.5rem', background: '#1A6163', color: 'white', textDecoration: 'none', borderRadius: '30px' }}>
        Volver al inicio
      </Link>
    </div>
  );
};

export default UnderConstruction;