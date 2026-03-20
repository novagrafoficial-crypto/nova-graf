// frontend/src/pages/Client/CatalogoCliente.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/CatalogoCliente.css';

const API = 'http://localhost:5000/api/client/productos';

const CatalogoCliente = () => {
  const navigate = useNavigate();
  const [productos, setProductos]               = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  // ── NUEVOS ESTADOS ──────────────────────────────────────────────────────────
  const [busqueda, setBusqueda]         = useState('');
  const [categoriaActiva, setCategoria] = useState(null); // null = todas
  const [categorias, setCategorias]     = useState([]);

  // ── FETCH PRODUCTOS ─────────────────────────────────────────────────────────
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

  // ── FETCH CATEGORÍAS ────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/categorias`)
      .then(res => setCategorias(res.data))
      .catch(err => console.error('Error categorías:', err));
  }, []);

  const seleccionarColor = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };

  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  // ── FILTRADO ────────────────────────────────────────────────────────────────
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda =
      p.producto_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      !categoriaActiva || p.categoria === categoriaActiva;
    return coincideBusqueda && coincideCategoria;
  });

  if (loading) {
    return <div className="catalogo-loading">Cargando productos...</div>;
  }

  return (
    <div className="catalogo-wrapper">
      <h2 className="catalogo-titulo">Catálogo</h2>

      {/* ── BUSCADOR ── */}
      <div className="catalogo-busqueda">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="catalogo-busqueda__input"
        />
      </div>

      {/* ── SLIDER DE CATEGORÍAS ── */}
      <div className="catalogo-slider">
        <button
          className={`slider-chip ${!categoriaActiva ? 'slider-chip--activo' : ''}`}
          onClick={() => setCategoria(null)}
        >
          Todos
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            className={`slider-chip ${categoriaActiva === cat.nombre ? 'slider-chip--activo' : ''}`}
            onMouseEnter={() => setCategoria(cat.nombre)}
            onClick={() =>
              setCategoria(categoriaActiva === cat.nombre ? null : cat.nombre)
            }
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* ── GRID DE PRODUCTOS ── */}
      <div className="catalogo-grid">
        {productosFiltrados.length === 0 ? (
          <p className="catalogo-sin-resultados">No se encontraron productos.</p>
        ) : (
          productosFiltrados.map((prod) => {
            const colorActivo = coloresSeleccionados[prod.producto_id] || null;
            const colores     = prod.colores_disponibles || [];

            return (
              <div key={prod.producto_id} className="producto-card">

                {/* Imagen */}
                <div className="producto-card__img-wrapper">
                  <img
                    src={
                      (colorActivo &&
                        prod.colores_imagenes?.find(c => c.color === colorActivo)?.imagen_url)
                      || prod.imagen_url
                      || 'https://via.placeholder.com/300x200?text=Sin+imagen'
                    }
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
          })
        )}
      </div>
    </div>
  );
};

export default CatalogoCliente;