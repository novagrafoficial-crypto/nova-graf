// frontend/src/pages/Client/CatalogoCliente.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/CatalogoCliente.css';

const API = 'http://localhost:5000/api/client/productos';

const CatalogoCliente = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading]     = useState(true);
  // Guarda qué color está seleccionado por producto: { [producto_id]: colorNombre }
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await axios.get(`${API}/catalogo`);
        setProductos(res.data);
      } catch (err) {
        console.error('Error al obtener productos:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const seleccionarColor = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };

  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  if (loading) {
    return <div className="catalogo-loading">Cargando productos...</div>;
  }

  return (
    <div className="catalogo-wrapper">
      <h2 className="catalogo-titulo">Catálogo</h2>

      <div className="catalogo-grid">
        {productos.map((prod) => {
          const colorActivo = coloresSeleccionados[prod.producto_id] || null;
          const colores     = prod.colores_disponibles || [];

          return (
            <div key={prod.producto_id} className="producto-card">

              {/* Imagen */}
              <div className="producto-card__img-wrapper">
                <img
                  src={prod.imagen_url || 'https://via.placeholder.com/300x200?text=Sin+imagen'}
                  alt={prod.producto_nombre}
                  className="producto-card__img"
                />
              </div>

              {/* Info */}
              <div className="producto-card__body">
                <h3 className="producto-card__nombre">{prod.producto_nombre}</h3>
                <p  className="producto-card__desc">{prod.descripcion}</p>
                <p  className="producto-card__precio">
                  ${Number(prod.precio_base).toFixed(2)}
                </p>

                {/* Colores */}
                {colores.length > 0 && (
                  <div className="producto-card__colores">
                    <span className="producto-card__colores-label">Color:</span>
                    <div className="producto-card__colores-lista">
                      {colores.map((color) => (
                        <button
                          key={color}
                          className={`color-chip ${colorActivo === color ? 'color-chip--activo' : ''}`}
                          onClick={() => seleccionarColor(prod.producto_id, color)}
                          title={color}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón ver detalle */}
                <button
                  className="btn-detalle"
                  onClick={() => verDetalle(prod.producto_id)}
                >
                  Ver detalle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CatalogoCliente;