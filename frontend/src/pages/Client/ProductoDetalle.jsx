// frontend/src/pages/Client/ProductoDetalle.jsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/ProductoDetalle.css';

const API = 'http://localhost:5000/api/client/productos';

const ProductoDetalle = () => {
  const { id }                  = useParams();
  const { state }               = useLocation();
  const navigate                = useNavigate();

  const [producto, setProducto]         = useState(null);
  const [varianteActiva, setVariante]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await axios.get(`${API}/${id}`);
        setProducto(res.data);

        // Si venimos con un color preseleccionado desde el catálogo, lo usamos
        const colorInicial = state?.colorSeleccionado;
        if (colorInicial) {
          const variante = res.data.variantes.find(v => v.color === colorInicial);
          setVariante(variante || res.data.variantes[0]);
        } else {
          setVariante(res.data.variantes[0]);
        }
      } catch (err) {
        console.error('Error al obtener detalle:', err);
        setError('No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id, state]);

  if (loading) return <div className="detalle-loading">Cargando producto...</div>;
  if (error)   return <div className="detalle-error">{error}</div>;
  if (!producto) return null;

  const precioFinal = Number(producto.precio_base) +
                      Number(varianteActiva?.precio_adicional || 0);

  return (
    <div className="detalle-wrapper">

      {/* Botón volver */}
      <button className="btn-volver" onClick={() => navigate(-1)}>
        ← Volver al catálogo
      </button>

      <div className="detalle-layout">

        {/* ── IMAGEN ── */}
        <div className="detalle-imagen">
          <img
            src={varianteActiva?.imagen_url || 'https://via.placeholder.com/500x400?text=Sin+imagen'}
            alt={producto.producto_nombre}
          />
        </div>

        {/* ── INFO ── */}
        <div className="detalle-info">

          <h1 className="detalle-nombre">{producto.producto_nombre}</h1>

          {/* Badges */}
          <div className="detalle-badges">
            {producto.categoria    && <span className="badge">{producto.categoria}</span>}
            {producto.subcategoria && <span className="badge">{producto.subcategoria}</span>}
            {producto.marca        && <span className="badge badge--marca">{producto.marca}</span>}
          </div>

          <p className="detalle-desc">{producto.descripcion}</p>

          {/* Precio */}
          <div className="detalle-precio">
            <span>${precioFinal.toFixed(2)}</span>
            {varianteActiva?.precio_adicional > 0 && (
              <small>(+${Number(varianteActiva.precio_adicional).toFixed(2)} por color)</small>
            )}
          </div>

          {/* Material */}
          {producto.material && (
            <p className="detalle-material">
              <strong>Material:</strong> {producto.material}
            </p>
          )}

          {/* Selector de colores */}
          <div className="detalle-colores">
            <p className="detalle-colores__label">
              Color seleccionado: <strong>{varianteActiva?.color || '—'}</strong>
            </p>
            <div className="detalle-colores__lista">
              {producto.variantes.map((v) => (
                <button
                  key={v.variante_id}
                  className={`color-chip ${varianteActiva?.variante_id === v.variante_id ? 'color-chip--activo' : ''}`}
                  onClick={() => setVariante(v)}
                  title={v.color}
                >
                  {v.color}
                </button>
              ))}
            </div>
          </div>

          {/* Atributos de la variante activa */}
          {varianteActiva?.atributos?.length > 0 && (
            <div className="detalle-atributos">
              <h3>Especificaciones</h3>
              <table className="atributos-tabla">
                <tbody>
                  {varianteActiva.atributos.map((atr, i) => (
                    <tr key={i}>
                      <td className="atr-tipo">{atr.tipo}</td>
                      <td className="atr-valor">{atr.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CTA */}
          <button className="btn-agregar">
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;