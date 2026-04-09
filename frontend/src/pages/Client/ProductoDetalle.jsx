import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/ProductoDetalle.css';

// ✅ 1. Definimos la URL base usando la variable de entorno
const API_BASE = import.meta.env.VITE_API_URL;
const API_PRODUCTOS = `${API_BASE}/api/client/productos`;

const ProductoDetalle = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [varianteActiva, setVariante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [atributosSeleccionados, setAtributos] = useState({});

  const [disenoPersonalizadoUrl, setDisenoPersonalizadoUrl] = useState(null);
  const [disenoJson, setDisenoJson] = useState(null);

  // Helper para normalizar URLs de imágenes (Render vs Local)
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    if (state?.disenoPersonalizadoUrl) {
      setDisenoPersonalizadoUrl(state.disenoPersonalizadoUrl);
      setDisenoJson(state.disenoJson);
      if (state.varianteSeleccionada) {
        setVariante(state.varianteSeleccionada);
      }
    }
  }, [state]);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        // ✅ 2. Uso de la ruta dinámica
        const res = await axios.get(`${API_PRODUCTOS}/${id}`);
        setProducto(res.data);
        
        const colorInicial = state?.colorSeleccionado;
        if (colorInicial) {
          const variante = res.data.variantes.find(v => v.color === colorInicial);
          setVariante(variante || res.data.variantes[0]);
        } else if (state?.varianteSeleccionada) {
          setVariante(state.varianteSeleccionada);
        } else {
          setVariante(res.data.variantes[0]);
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar el producto.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id, state]);

  if (loading) return <div className="detalle-loading">Cargando producto...</div>;
  if (error) return <div className="detalle-error">{error}</div>;
  if (!producto) return null;

  const coloresUnicos = [...new Map(producto.variantes.map(v => [v.color, v])).values()];
  const variantesDelColor = producto.variantes.filter(v => v.color === varianteActiva?.color);
  
  const atributosAgrupados = variantesDelColor.reduce((acc, v) => {
    (v.atributos || []).forEach(({ tipo, valor }) => {
      if (!acc[tipo]) acc[tipo] = new Set();
      acc[tipo].add(valor);
    });
    return acc;
  }, {});

  const seleccionarAtributo = (tipo, valor) => {
    setAtributos(prev => ({ ...prev, [tipo]: valor }));
  };

  const precioFinal = Number(producto.precio_base) + Number(varianteActiva?.precio_adicional || 0);

  const abrirPersonalizador = () => {
    navigate(`/cliente/producto/${id}/personalizar`, {
      state: {
        // ✅ 3. Normalización de URL al navegar
        imagenProducto: getFullImageUrl(varianteActiva?.imagen_url || producto?.imagen_url),
        productoId: id,
        variante: varianteActiva,
      }
    });
  };

  const solicitarDiseno = () => {
    navigate(`/cliente/producto/${id}/solicitar`, {
      state: {
        variante: varianteActiva,
        productoId: id,
        productoNombre: producto.producto_nombre
      }
    });
  };

  const quitarDiseno = () => {
    setDisenoPersonalizadoUrl(null);
    setDisenoJson(null);
  };

  return (
    <div className="detalle-wrapper">
      <button className="btn-volver" onClick={() => navigate(-1)}>← Volver al catálogo</button>
      <div className="detalle-layout">
        <div className="detalle-imagen">
          {/* ✅ 4. Aplicación de getFullImageUrl para la imagen principal */}
          <img
            src={disenoPersonalizadoUrl || getFullImageUrl(varianteActiva?.imagen_url) || 'https://via.placeholder.com/500x400?text=Sin+imagen'}
            alt={producto.producto_nombre}
          />
          {disenoPersonalizadoUrl && <div className="diseno-badge">✨ Personalizado</div>}
        </div>
        
        <div className="detalle-info">
          <h1 className="detalle-nombre">{producto.producto_nombre}</h1>
          <div className="detalle-badges">
            {producto.categoria && <span className="badge">{producto.categoria}</span>}
            {producto.subcategoria && <span className="badge">{producto.subcategoria}</span>}
            {producto.marca && <span className="badge badge--marca">{producto.marca}</span>}
          </div>
          <p className="detalle-desc">{producto.descripcion}</p>
          <div className="detalle-precio">
            <span>${precioFinal.toFixed(2)}</span>
            {varianteActiva?.precio_adicional > 0 && <small>(+${Number(varianteActiva.precio_adicional).toFixed(2)} por color)</small>}
          </div>
          {producto.material && <p className="detalle-material"><strong>Material:</strong> {producto.material}</p>}

          <div className="detalle-colores">
            <p className="detalle-colores__label">Color: <strong>{varianteActiva?.color || '—'}</strong></p>
            <div className="detalle-colores__lista">
              {coloresUnicos.map(v => (
                <button
                  key={v.variante_id}
                  className={`color-thumb ${varianteActiva?.color === v.color ? 'color-thumb--activo' : ''}`}
                  onClick={() => {
                    setVariante(v);
                    setAtributos({});
                    setDisenoPersonalizadoUrl(null);
                    setDisenoJson(null);
                  }}
                  title={v.color}
                >
                  {/* ✅ 5. Aplicación de getFullImageUrl para las miniaturas */}
                  {v.imagen_url ? (
                    <img src={getFullImageUrl(v.imagen_url)} alt={v.color} className="color-thumb__img" />
                  ) : (
                    <span className="color-thumb__text">{v.color}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(atributosAgrupados).map(([tipo, valores]) => (
            <div key={tipo} className="detalle-atributo-grupo">
              <p className="detalle-atributo-grupo__label">{tipo}: <strong>{atributosSeleccionados[tipo] || 'Elige'}</strong></p>
              <div className="detalle-atributo-grupo__opciones">
                {[...valores].map(valor => (
                  <button key={valor} className={`atributo-chip ${atributosSeleccionados[tipo] === valor ? 'atributo-chip--activo' : ''}`} onClick={() => seleccionarAtributo(tipo, valor)}>
                    {valor}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="detalle-cantidad">
            <label htmlFor="cantidad">Cantidad:</label>
            <input type="number" id="cantidad" min="1" value={cantidad} onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))} className="cantidad-input" />
          </div>

          <p className="detalle-aviso-personalizacion">
            ⚠️ Este producto requiere ser personalizado antes de agregar al carrito.
          </p>

          <div className="detalle-acciones">
            <button className="btn-personalizar" onClick={abrirPersonalizador}>🎨 Personalizar</button>
            <button className="btn-solicitar" onClick={solicitarDiseno}>📎 Solicitar diseño</button>
          </div>

          {disenoPersonalizadoUrl && (
            <div className="diseno-info">
              <span>✓ Diseño personalizado listo</span>
              <button className="btn-quitar-diseno" onClick={quitarDiseno}>✕ Quitar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductoDetalle;