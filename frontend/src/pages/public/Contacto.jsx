import React, { useEffect, useState } from 'react';

const API_BASE = 'https://nova-graf-zbdt.onrender.com';

const Contacto = () => {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/ubicacion`)
      .then(res => {
        if (!res.ok) throw new Error("Error 404 o 500");
        return res.json();
      })
      .then(json => {
        if (json.success) setUbicaciones(json.data);
        else setError('No se pudieron cargar los datos.');
      })
      .catch(() => setError('Error al conectar con el servidor de Render.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{padding: '100px 20px', textAlign: 'center'}}>
      <h1>Nuestras Ubicaciones</h1>
      {loading && <p>Cargando...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'}}>
        {ubicaciones.map(u => (
          <div key={u.ubicacion_id} style={{border: '1px solid #ccc', padding: '20px', borderRadius: '10px'}}>
            <p><strong>Ciudad:</strong> {u.ciudad}</p>
            <p><strong>Dirección:</strong> {u.direccion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Contacto;