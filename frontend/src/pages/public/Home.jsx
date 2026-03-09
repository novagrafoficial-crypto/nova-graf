// pages/public/Home.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000'; // ← era 3000, error corregido

const Home = () => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get(`${API}/api/public/productos`);
        setProductos(res.data);
      } catch (error) {
        console.error('Error cargando productos', error);
      }
    };
    fetchProductos();
  }, []);

  return (
    <main>
      <section id="catalogo">
        <h2>Catálogo de Productos</h2>
        <div className="productos-grid">
          {productos.length > 0 ? (
            productos.map((prod) => (
              <div key={prod.id} className="producto-card">
                <img
                  src={prod.imagen_url || '/placeholder.png'}
                  alt={prod.nombre}
                  onError={e => { e.target.src = '/placeholder.png'; }}
                />
                <h3>{prod.nombre}</h3>
                <p>${Number(prod.precio_base).toLocaleString('es-MX')}</p>
              </div>
            ))
          ) : (
            <p>No hay productos publicados por el momento.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;