import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/CatalogoCliente.css';

const API_URL = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_URL}/api/client/productos`;

const ORDEN_OPCIONES = [
  { value: 'reciente',    label: 'Más reciente' },
  { value: 'precio_asc',  label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
];

const CatalogoCliente = () => {
  const navigate  = useNavigate();

  // ── DATOS ─────────────────────────────────────
  const [productos,     setProductos]     = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── FILTROS ───────────────────────────────────
  const [busqueda,       setBusqueda]       = useState('');
  const [categoriaId,    setCategoriaId]    = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [precioMin,      setPrecioMin]      = useState('');
  const [precioMax,      setPrecioMax]      = useState('');
  const [orden,          setOrden]          = useState('reciente');

  // ── COLOR ACTIVO POR TARJETA ──────────────────
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  // ── FETCH ─────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API_ENDPOINT}/catalogo`),
      axios.get(`${API_ENDPOINT}/categorias`),
      axios.get(`${API_ENDPOINT}/subcategorias`),
    ]).then(([pRes, cRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProductos(pRes.value.data);
      if (cRes.status === 'fulfilled') setCategorias(cRes.value.data);
      if (sRes.status === 'fulfilled') setSubcategorias(sRes.value.data);
    }).catch(err => console.error('Error cargando el catálogo:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── SUBCATEGORÍAS FILTRADAS ───────────────────
  const subcategoriasFiltradas = useMemo(() => {
    if (!categoriaId) return [];
    const catNombre = categorias.find(c => c.id == categoriaId)?.nombre;
    if (!catNombre) return [];
    const set = new Set(
      productos
        .filter(p => p.categoria === catNombre && p.subcategoria)
        .map(p => p.subcategoria)
    );
    return subcategorias.filter(s => set.has(s.nombre));
  }, [categoriaId, productos, subcategorias, categorias]);

  useEffect(() => { setSubcategoriaId(''); }, [categoriaId]);

  // ── PRECIO MÁXIMO ─────────────────────────────
  const precioMaxCatalogo = useMemo(() =>
    productos.length > 0
      ? Math.ceil(Math.max(...productos.map(p => Number(p.precio_base)), 0))
      : 0,
  [productos]);

  // ── FILTRADO + ORDEN ──────────────────────────
  const productosFiltrados = useMemo(() => {
    const catNombre = categorias.find(c => c.id == categoriaId)?.nombre;
    const subNombre = subcategorias.find(s => s.id == subcategoriaId)?.nombre;

    let lista = productos.filter(p => {
      const txt = busqueda.toLowerCase();
      return (
        (!busqueda ||
          p.producto_nombre.toLowerCase().includes(txt) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(txt))) &&
        (!categoriaId    || p.categoria    === catNombre) &&
        (!subcategoriaId || p.subcategoria === subNombre) &&
        (!precioMin || Number(p.precio_base) >= Number(precioMin)) &&
        (!precioMax || Number(p.precio_base) <= Number(precioMax))
      );
    });

    if (orden === 'precio_asc')  lista.sort((a, b) => a.precio_base - b.precio_base);
    if (orden === 'precio_desc') lista.sort((a, b) => b.precio_base - a.precio_base);
    return lista;
  }, [productos, busqueda, categoriaId, subcategoriaId, precioMin, precioMax, orden, categorias, subcategorias]);

  const hayFiltros = busqueda || categoriaId || subcategoriaId || precioMin || precioMax || orden !== 'reciente';

  const limpiarFiltros = () => {
    setBusqueda(''); setCategoriaId(''); setSubcategoriaId('');
    setPrecioMin(''); setPrecioMax(''); setOrden('reciente');
  };

  // ── HANDLERS ─────────────────────────────────
  const seleccionarColor = (productoId, color) =>
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));

  const verDetalle = (productoId) =>
    navigate(`/cliente/producto/${productoId}`, {
      state: { colorSeleccionado: coloresSeleccionados[productoId] || '' }
    });

  // ── RENDER ────────────────────────────────────
  if (loading) return <div className="catalogo-loading">Cargando productos…</div>;

  return (
    <div className="catalogo-wrapper">

      {/* ── HERO ── */}
      <div className="catalogo-header">
        <h2 className="catalogo-titulo">Elige tu producto base</h2>
        <p className="catalogo-subtitulo">
          Personaliza cada pieza a tu medida — diseño, color y estilo únicos.
        </p>
      </div>

      {/* ── FILTROS STICKY ── */}
      <div className="catalogo-filtros">

        {/* Búsqueda */}
        <div className="catalogo-busqueda">
          <span className="catalogo-busqueda__icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Categoría */}
        <select
          value={categoriaId}
          onChange={e => setCategoriaId(e.target.value)}
          className="catalogo-select"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        {/* Subcategoría */}
        <select
          value={subcategoriaId}
          onChange={e => setSubcategoriaId(e.target.value)}
          disabled={!categoriaId || subcategoriasFiltradas.length === 0}
          className="catalogo-select"
        >
          <option value="">Subcategorías</option>
          {subcategoriasFiltradas.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        {/* Orden */}
        <select
          value={orden}
          onChange={e => setOrden(e.target.value)}
          className="catalogo-select"
        >
          {ORDEN_OPCIONES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* ── Rango de precio INLINE — siempre visible a la derecha ── */}
        <div className="precio-inline">
          <span className="precio-inline__label">Precio</span>
          <input
            type="number"
            className="precio-inline__input"
            placeholder={`Mín`}
            value={precioMin}
            onChange={e => setPrecioMin(e.target.value)}
          />
          <span className="precio-inline__sep">—</span>
          <input
            type="number"
            className="precio-inline__input"
            placeholder={`Máx`}
            value={precioMax}
            onChange={e => setPrecioMax(e.target.value)}
          />
        </div>

        {/* Limpiar */}
        {hayFiltros && (
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* ── GRID ── */}
      <div className="catalogo-contenido">
        {productosFiltrados.length === 0 ? (
          <div className="catalogo-sin-resultados">
            No se encontraron productos con esos filtros.
          </div>
        ) : (
          <div className="catalogo-grid">
            {productosFiltrados.map(prod => {
              const colorActivo = coloresSeleccionados[prod.producto_id] || null;
              const colores     = prod.colores_disponibles || [];
              const imagenSrc   =
                (colorActivo &&
                  prod.colores_imagenes?.find(c => c.color === colorActivo)?.imagen_url)
                || prod.imagen_url
                || 'https://placehold.co/400x400?text=Sin+imagen';

              return (
                <div key={prod.producto_id} className="producto-card">
                  <div className="producto-card__img-wrapper">
                    <img src={imagenSrc} alt={prod.producto_nombre} />
                  </div>

                  <div className="producto-card__body">
                    <h3>{prod.producto_nombre}</h3>
                    <p className="desc">{prod.descripcion}</p>
                    <p className="precio">${Number(prod.precio_base).toFixed(2)}</p>

                    {colores.length > 0 && (
                      <div className="colores">
                        <span className="colores-label">Colores disponibles</span>
                        <div className="colores-lista">
                          {colores.map(color => (
                            <button
                              key={color}
                              className={`color-chip ${colorActivo === color ? 'activo' : ''}`}
                              onClick={() => seleccionarColor(prod.producto_id, color)}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="btn-detalle"
                      onClick={() => verDetalle(prod.producto_id)}
                    >
                      Ver detalles →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default CatalogoCliente;