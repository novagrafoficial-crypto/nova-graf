// frontend/src/pages/Client/ProductoDetalle.jsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductoPersonalizador from '../../pages/Client/ProductoPersonalizador';
import '../../styles/client/ProductoDetalle.css';

const API = 'http://localhost:5000/api/client/productos';

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

  // Estados para el editor de personalización
  const [mostrarEditor, setMostrarEditor] = useState(false);
  const [disenoPersonalizadoUrl, setDisenoPersonalizadoUrl] = useState(null);
  const [disenoJson, setDisenoJson] = useState(null);

  // ── FETCH DETALLE ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await axios.get(`${API}/${id}`);
        setProducto(res.data);
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
  if (error) return <div className="detalle-error">{error}</div>;
  if (!producto) return null;

  // ── COLORES ÚNICOS ──────────────────────────────────────────────────────
  const coloresUnicos = [
    ...new Map(producto.variantes.map(v => [v.color, v])).values(),
  ];

  // ── VARIANTES DEL COLOR ACTIVO ─────────────────────────────────────────
  const variantesDelColor = producto.variantes.filter(
    v => v.color === varianteActiva?.color
  );

  // ── ATRIBUTOS AGRUPADOS ────────────────────────────────────────────────
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

  // ── PRECIO FINAL ───────────────────────────────────────────────────────
  const precioFinal =
    Number(producto.precio_base) +
    Number(varianteActiva?.precio_adicional || 0);

  // ── HANDLERS DE CARRITO ────────────────────────────────────────────────
  const agregarAlCarrito = () => {
    const item = {
      producto_id: producto.producto_id,
      nombre: producto.producto_nombre,
      variante: varianteActiva,
      cantidad,
      precio: precioFinal,
      personalizado: disenoPersonalizadoUrl ? {
        imagenUrl: disenoPersonalizadoUrl,
        json: disenoJson
      } : null
    };
    console.log('Agregar al carrito:', item);
    alert(`✅ ${cantidad} unidad(es) de "${producto.producto_nombre}" agregadas al carrito`);
    // Aquí puedes integrar tu lógica real de carrito (context, API, etc.)
  };

  const comprarAhora = () => {
    console.log('Comprar ahora:', {
      producto_id: producto.producto_id,
      nombre: producto.producto_nombre,
      variante: varianteActiva,
      cantidad,
      precio: precioFinal,
      personalizado: disenoPersonalizadoUrl ? true : false
    });
    alert(`🛒 Redirigiendo al checkout con ${cantidad} unidad(es)`);
    // navigate('/cliente/carrito');
  };

  // ── MANEJADORES DEL EDITOR ─────────────────────────────────────────────
  const abrirPersonalizador = () => {
    setMostrarEditor(true);
  };

  const guardarDiseno = (imagenUrl, json) => {
    setDisenoPersonalizadoUrl(imagenUrl);
    setDisenoJson(json);
    setMostrarEditor(false);
    alert('¡Diseño personalizado guardado! Ahora puedes agregarlo al carrito.');
  };

  const cancelarDiseno = () => {
    setMostrarEditor(false);
  };

  // Imagen que se usará en el editor (la variante activa o la principal)
  const imagenParaEditor = varianteActiva?.imagen_url || producto?.imagen_url || '';

  return (
    <div className="detalle-wrapper">
      {/* Botón volver */}
      <button className="btn-volver" onClick={() => navigate(-1)}>
        ← Volver al catálogo
      </button>

      <div className="detalle-layout">
        {/* ── IMAGEN GRANDE (muestra diseño personalizado si existe) ── */}
        <div className="detalle-imagen">
          <img
            src={disenoPersonalizadoUrl || varianteActiva?.imagen_url || 'https://via.placeholder.com/500x400?text=Sin+imagen'}
            alt={producto.producto_nombre}
          />
          {disenoPersonalizadoUrl && (
            <div className="diseno-badge">✨ Personalizado</div>
          )}
        </div>

        {/* ── INFORMACIÓN DEL PRODUCTO ── */}
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
            {varianteActiva?.precio_adicional > 0 && (
              <small>(+${Number(varianteActiva.precio_adicional).toFixed(2)} por color)</small>
            )}
          </div>

          {producto.material && (
            <p className="detalle-material">
              <strong>Material:</strong> {producto.material}
            </p>
          )}

          {/* ── SELECTOR DE COLOR CON MINIATURAS ── */}
          <div className="detalle-colores">
            <p className="detalle-colores__label">
              Color: <strong>{varianteActiva?.color || '—'}</strong>
            </p>
            <div className="detalle-colores__lista">
              {coloresUnicos.map((v) => (
                <button
                  key={v.variante_id}
                  className={`color-thumb ${varianteActiva?.color === v.color ? 'color-thumb--activo' : ''}`}
                  onClick={() => {
                    setVariante(v);
                    setAtributos({});
                    // Al cambiar de color, se pierde el diseño personalizado
                    setDisenoPersonalizadoUrl(null);
                    setDisenoJson(null);
                  }}
                  title={v.color}
                >
                  {v.imagen_url ? (
                    <img src={v.imagen_url} alt={v.color} className="color-thumb__img" />
                  ) : (
                    <span className="color-thumb__text">{v.color}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── ATRIBUTOS AGRUPADOS ── */}
          {Object.entries(atributosAgrupados).map(([tipo, valores]) => (
            <div key={tipo} className="detalle-atributo-grupo">
              <p className="detalle-atributo-grupo__label">
                {tipo}: <strong>{atributosSeleccionados[tipo] || 'Elige'}</strong>
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
            <input
              type="number"
              id="cantidad"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
              className="cantidad-input"
            />
          </div>

          {/* ── BOTONES DE ACCIÓN ── */}
          <div className="detalle-acciones">
            <button className="btn-personalizar" onClick={abrirPersonalizador}>
              🎨 Personalizar
            </button>
            <button className="btn-agregar-carrito" onClick={agregarAlCarrito}>
              🛒 Agregar al carrito
            </button>
            <button className="btn-comprar-ahora" onClick={comprarAhora}>
              ⚡ Comprar ahora
            </button>
          </div>

          {disenoPersonalizadoUrl && (
            <div className="diseno-info">
              <span>✓ Diseño personalizado listo</span>
              <button className="btn-quitar-diseno" onClick={() => { setDisenoPersonalizadoUrl(null); setDisenoJson(null); }}>
                ✕ Quitar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal del editor de personalización */}
      {mostrarEditor && (
        <ProductoPersonalizador
          imagenProducto={imagenParaEditor}
          onGuardar={guardarDiseno}
          onCancelar={cancelarDiseno}
        />
      )}
    </div>
  );
};

export default ProductoDetalle;