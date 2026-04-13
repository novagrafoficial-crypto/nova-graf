import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/ProductoDetalle.css';

const API_URL = import.meta.env.VITE_API_URL;
const API_PRODUCTOS = `${API_URL}/api/client/productos`;

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

  const [portafolio, setPortafolio] = useState([]);
  const [cargandoRefs, setCargandoRefs] = useState(false);

  const [modalImageUrl, setModalImageUrl] = useState(null);

  useEffect(() => {
    if (state?.disenoPersonalizadoUrl) {
      setDisenoPersonalizadoUrl(state.disenoPersonalizadoUrl);
      setDisenoJson(state.disenoJson);
      if (state.varianteSeleccionada) setVariante(state.varianteSeleccionada);
    }
  }, [state]);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
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

  useEffect(() => {
    if (!id) return;
    setCargandoRefs(true);
    axios.get(`${API_PRODUCTOS}/${id}/portafolio`)
      .then(res => setPortafolio(res.data))
      .catch(err => console.error('Error cargando portafolio:', err))
      .finally(() => setCargandoRefs(false));
  }, [id]);

  const openImageModal = (url) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    setModalImageUrl(fullUrl);
  };
  const closeModal = () => setModalImageUrl(null);

  if (loading) return <div className="detalle-loading">Cargando producto…</div>;
  if (error)   return <div className="detalle-error">{error}</div>;
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

  const seleccionarAtributo = (tipo, valor) =>
    setAtributos(prev => ({ ...prev, [tipo]: valor }));

  const precioFinal = Number(producto.precio_base) + Number(varianteActiva?.precio_adicional || 0);

  const abrirPersonalizador = () =>
    navigate(`/cliente/producto/${id}/personalizar`, {
      state: {
        imagenProducto: varianteActiva?.imagen_url || producto?.imagen_url,
        productoId: id,
        variante: varianteActiva,
      }
    });

  const solicitarDiseno = () =>
    navigate(`/cliente/producto/${id}/solicitar`, {
      state: {
        variante: varianteActiva,
        productoId: id,
        productoNombre: producto.producto_nombre,
      }
    });

  const quitarDiseno = () => {
    setDisenoPersonalizadoUrl(null);
    setDisenoJson(null);
  };

  const portafolioLimitado = portafolio.slice(0, 4);

  return (
    <div className="detalle-wrapper">

      {/* ── HERO HEADER ── */}
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver al catálogo
        </button>
        <h2 className="detalle-header__titulo">Personaliza tu producto</h2>
        <p className="detalle-header__subtitulo">
          Elige color, talla y diseño — hecho únicamente para ti.
        </p>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="detalle-contenido">
        <div className="detalle-layout">

          {/* ── REFERENCIAS / PORTAFOLIO ── */}
          {portafolioLimitado.length > 0 && (
            <div className="detalle-referencias">
              <h4>✦ Inspiración</h4>
              <div className="detalle-referencias-grid">
                {portafolioLimitado.map(ref => {
                  const imgUrl = ref.imagen_url?.startsWith('http')
                    ? ref.imagen_url
                    : `${API_URL}${ref.imagen_url}`;
                  return (
                    <img
                      key={ref.id}
                      src={imgUrl}
                      alt={ref.descripcion || 'Referencia'}
                      className="ref-img"
                      onClick={() => openImageModal(ref.imagen_url)}
                      title="Ver ampliado"
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ── IMAGEN CENTRAL ── */}
          <div className="detalle-imagen">
            <img
              src={
                disenoPersonalizadoUrl ||
                varianteActiva?.imagen_url ||
                'https://via.placeholder.com/500x400?text=Sin+imagen'
              }
              alt={producto.producto_nombre}
              onClick={() => openImageModal(disenoPersonalizadoUrl || varianteActiva?.imagen_url)}
            />
            {disenoPersonalizadoUrl && (
              <div className="diseno-badge">✦ Diseño aplicado</div>
            )}
          </div>

          {/* ── INFO DEL PRODUCTO ── */}
          <div className="detalle-info">

            <h1 className="detalle-nombre">{producto.producto_nombre}</h1>

            <div className="detalle-badges">
              {producto.categoria    && <span className="badge">{producto.categoria}</span>}
              {producto.subcategoria && <span className="badge">{producto.subcategoria}</span>}
              {producto.marca        && <span className="badge badge--marca">{producto.marca}</span>}
            </div>

            <p className="detalle-desc">{producto.descripcion}</p>

            <div className="detalle-precio">
              <span>${precioFinal.toFixed(2)}</span>
              {varianteActiva?.precio_adicional > 0 && (
                <small>(+${Number(varianteActiva.precio_adicional).toFixed(2)} por este color)</small>
              )}
            </div>

            {producto.material && (
              <p className="detalle-material">
                <strong>Material:</strong> {producto.material}
              </p>
            )}

            {/* SELECTOR DE COLOR */}
            <div className="detalle-colores">
              <p className="detalle-colores__label">
                Color: <strong>{varianteActiva?.color || '—'}</strong>
              </p>
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
                    {v.imagen_url
                      ? <img src={v.imagen_url} alt={v.color} className="color-thumb__img" />
                      : <span className="color-thumb__text">{v.color}</span>
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* ATRIBUTOS */}
            {Object.entries(atributosAgrupados).map(([tipo, valores]) => (
              <div key={tipo} className="detalle-atributo-grupo">
                <p className="detalle-atributo-grupo__label">
                  {tipo}: <strong>{atributosSeleccionados[tipo] || 'Elige una opción'}</strong>
                </p>
                <div className="detalle-atributo-grupo__opciones">
                  {[...valores].map(valor => (
                    <button
                      key={valor}
                      className={`atributo-chip ${atributosSeleccionados[tipo] === valor ? 'atributo-chip--activo' : ''}`}
                      onClick={() => seleccionarAtributo(tipo, valor)}
                    >
                      {valor}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* CANTIDAD */}
            <div className="detalle-cantidad">
              <label htmlFor="cantidad">Cantidad:</label>
              <input
                type="number"
                id="cantidad"
                min="1"
                value={cantidad}
                onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="cantidad-input"
              />
            </div>

            {/* AVISO */}
            <p className="detalle-aviso-personalizacion">
              <strong>Este producto se hace a tu medida</strong>
              Antes de agregarlo al carrito, necesitas personalizarlo: elige el diseño,
              texto o imagen que llevará. ¡Así garantizamos que sea único para ti!
            </p>

            {/* ACCIONES */}
            <div className="detalle-acciones">
              <button className="btn-personalizar" onClick={abrirPersonalizador}>
                🎨 Personalizar ahora
              </button>
              <button className="btn-solicitar" onClick={solicitarDiseno}>
                📎 Solicitar diseño
              </button>
            </div>

            {/* DISEÑO APLICADO */}
            {disenoPersonalizadoUrl && (
              <div className="diseno-info">
                <span>✓ Diseño personalizado listo</span>
                <button className="btn-quitar-diseno" onClick={quitarDiseno}>✕ Quitar</button>
              </div>
            )}

          </div>{/* fin detalle-info */}
        </div>{/* fin detalle-layout */}
      </div>{/* fin detalle-contenido */}

      {/* ── MODAL ── */}
      {modalImageUrl && (
        <div className="detalle-modal-overlay" onClick={closeModal}>
          <div className="detalle-modal-content" onClick={e => e.stopPropagation()}>
            <button className="detalle-modal-close" onClick={closeModal}>✕</button>
            <img src={modalImageUrl} alt="Vista ampliada" />
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductoDetalle;