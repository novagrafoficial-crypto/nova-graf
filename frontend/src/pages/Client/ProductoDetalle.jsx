//pages/Client/ProductoDetalle.jsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/ProductoDetalle.css';

const API_URL      = import.meta.env.VITE_API_URL;
const API_PRODUCTOS = `${API_URL}/api/client/productos`;
const API_CARRITO   = `${API_URL}/api/client/carrito`;

const ProductoDetalle = () => {
  const { id }       = useParams();
  const { state }    = useLocation();
  const navigate     = useNavigate();

  const [producto,          setProducto]  = useState(null);
  const [varianteActiva,    setVariante]  = useState(null);
  const [loading,           setLoading]   = useState(true);
  const [error,             setError]     = useState(null);
  const [cantidad,          setCantidad]  = useState(1);
  const [atributosSeleccionados, setAtributos] = useState({});

  const [portafolio,        setPortafolio]    = useState([]);
  const [modalImageUrl,     setModalImageUrl] = useState(null);

  // ── Feedback del botón agregar ──────────────────
  const [agregando,  setAgregando]  = useState(false);
  const [agregado,   setAgregado]   = useState(false);
  const [errorCarrito, setErrorCarrito] = useState('');

  // ── Fetch producto ─────────────────────────────
  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await axios.get(`${API_PRODUCTOS}/${id}`);
        setProducto(res.data);
        const colorInicial = state?.colorSeleccionado;
        if (colorInicial) {
          const variante = res.data.variantes.find(v => v.color === colorInicial);
          setVariante(variante || res.data.variantes[0]);
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

  // ── Fetch portafolio ───────────────────────────
  useEffect(() => {
    if (!id) return;
    axios.get(`${API_PRODUCTOS}/${id}/portafolio`)
      .then(res => setPortafolio(res.data.slice(0, 4)))
      .catch(err => console.error('Error cargando portafolio:', err));
  }, [id]);

  // ── Modal ──────────────────────────────────────
  const openImageModal = (url) => {
    if (!url) return;
    setModalImageUrl(url.startsWith('http') ? url : `${API_URL}${url}`);
  };
  const closeModal = () => setModalImageUrl(null);

  // ── Atributos ──────────────────────────────────
  const coloresUnicos        = producto
    ? [...new Map(producto.variantes.map(v => [v.color, v])).values()]
    : [];

  const variantesDelColor    = producto
    ? producto.variantes.filter(v => v.color === varianteActiva?.color)
    : [];

  const atributosAgrupados   = variantesDelColor.reduce((acc, v) => {
    (v.atributos || []).forEach(({ tipo, valor }) => {
      if (!acc[tipo]) acc[tipo] = new Set();
      acc[tipo].add(valor);
    });
    return acc;
  }, {});

  const seleccionarAtributo  = (tipo, valor) =>
    setAtributos(prev => ({ ...prev, [tipo]: valor }));

  const precioFinal = producto
    ? Number(producto.precio_base) + Number(varianteActiva?.precio_adicional || 0)
    : 0;

  // ── ¿Todos los atributos elegidos? ────────────
  const atributosPendientes = Object.keys(atributosAgrupados).filter(
    tipo => !atributosSeleccionados[tipo]
  );
  const puedeAgregar = atributosPendientes.length === 0 && varianteActiva;

  // ── Agregar al carrito ─────────────────────────
  const agregarAlCarrito = async () => {
    if (!puedeAgregar) return;
    setAgregando(true);
    setErrorCarrito('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        API_CARRITO,
        { variante_id: varianteActiva.variante_id, cantidad },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAgregado(true);
      setTimeout(() => setAgregado(false), 3000);
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
      if (err.response?.status === 401) {
        navigate('/login', { state: { from: `/cliente/producto/${id}` } });
      } else {
        setErrorCarrito('No se pudo agregar. Intenta de nuevo.');
      }
    } finally {
      setAgregando(false);
    }
  };

  // ── Render ─────────────────────────────────────
  if (loading) return <div className="detalle-loading">Cargando producto…</div>;
  if (error)   return <div className="detalle-error">{error}</div>;
  if (!producto) return null;

  return (
    <div className="detalle-wrapper">

      {/* ── HEADER ── */}
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          ← Volver al catálogo
        </button>
        <h2 className="detalle-header__titulo">{producto.producto_nombre}</h2>
        <p className="detalle-header__subtitulo">
          Elige tu color y opciones — el diseño lo coordinas con nosotros después de tu pedido.
        </p>
      </div>

      <div className="detalle-contenido">
        <div className="detalle-layout">

          {/* ── PORTAFOLIO / INSPIRACIÓN ── */}
          {portafolio.length > 0 && (
            <div className="detalle-referencias">
              <h4>✦ Trabajos anteriores</h4>
              <div className="detalle-referencias-grid">
                {portafolio.map(ref => {
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

          {/* ── IMAGEN ── */}
          <div className="detalle-imagen">
            <img
              src={varianteActiva?.imagen_url || 'https://placehold.co/500x400?text=Sin+imagen'}
              alt={producto.producto_nombre}
              onClick={() => openImageModal(varianteActiva?.imagen_url)}
            />
          </div>

          {/* ── INFO ── */}
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

            {/* ── SELECTOR DE COLOR ── */}
            <div className="detalle-colores">
              <p className="detalle-colores__label">
                Color: <strong>{varianteActiva?.color || '—'}</strong>
              </p>
              <div className="detalle-colores__lista">
                {coloresUnicos.map(v => (
                  <button
                    key={v.variante_id}
                    className={`color-thumb ${varianteActiva?.color === v.color ? 'color-thumb--activo' : ''}`}
                    onClick={() => { setVariante(v); setAtributos({}); }}
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

            {/* ── ATRIBUTOS (talla, tamaño, etc.) ── */}
            {Object.entries(atributosAgrupados).map(([tipo, valores]) => (
              <div key={tipo} className="detalle-atributo-grupo">
                <p className="detalle-atributo-grupo__label">
                  {tipo}:{' '}
                  {atributosSeleccionados[tipo]
                    ? <strong>{atributosSeleccionados[tipo]}</strong>
                    : <span className="atributo-pendiente">Elige una opción</span>
                  }
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

            {/* ── CANTIDAD ── */}
            <div className="detalle-cantidad">
              <label htmlFor="cantidad">Cantidad:</label>
              <div className="cantidad-control">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="cantidad-btn"
                >−</button>
                <input
                  type="number"
                  id="cantidad"
                  min="1"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="cantidad-input"
                />
                <button
                  onClick={() => setCantidad(c => c + 1)}
                  className="cantidad-btn"
                >+</button>
              </div>
            </div>

            {/* ── BANNER INFORMATIVO ── */}
            <div className="detalle-flujo-info">
              <div className="flujo-paso">
                <span className="flujo-num">1</span>
                <span>Agrega al carrito y elige tu cantidad</span>
              </div>
              <div className="flujo-sep">→</div>
              <div className="flujo-paso">
                <span className="flujo-num">2</span>
                <span>Realiza el pago del 50% para confirmar</span>
              </div>
              <div className="flujo-sep">→</div>
              <div className="flujo-paso">
                <span className="flujo-num">3</span>
                <span>Nos envías tu diseño y coordinamos juntos</span>
              </div>
            </div>

            {/* ── BOTÓN AGREGAR AL CARRITO ── */}
            {atributosPendientes.length > 0 && (
              <p className="detalle-aviso-atributos">
                Selecciona: {atributosPendientes.join(', ')} para continuar.
              </p>
            )}

            {errorCarrito && (
              <p className="detalle-error-carrito">{errorCarrito}</p>
            )}

            <div className="detalle-acciones">
              <button
                className={`btn-agregar-carrito ${agregado ? 'btn-agregar-carrito--ok' : ''}`}
                onClick={agregarAlCarrito}
                disabled={!puedeAgregar || agregando}
              >
                {agregando
                  ? 'Agregando…'
                  : agregado
                    ? '✓ Agregado al carrito'
                    : '🛒 Agregar al carrito'
                }
              </button>

              {agregado && (
                <button
                  className="btn-ir-carrito"
                  onClick={() => navigate('/cliente/carrito')}
                >
                  Ver carrito →
                </button>
              )}
            </div>

          </div>{/* fin detalle-info */}
        </div>
      </div>

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