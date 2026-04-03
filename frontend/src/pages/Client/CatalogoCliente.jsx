// frontend/src/pages/Client/CatalogoCliente.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/CatalogoCliente.css';

const API = 'http://localhost:5000/api/client/productos';

const ORDEN_OPCIONES = [
  { value: 'reciente',    label: 'Más reciente'          },
  { value: 'precio_asc',  label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
];

const CatalogoCliente = () => {
  const navigate  = useNavigate();
  const dropRef   = useRef(null);
  const precioRef = useRef(null);

  // ── DATOS ────────────────────────────────────────────────────────────────────
  const [productos,     setProductos]     = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── FILTROS ──────────────────────────────────────────────────────────────────
  const [busqueda,           setBusqueda]     = useState('');
  const [categoriaActiva,    setCategoria]    = useState(null);
  const [subcategoriaActiva, setSubcategoria] = useState(null);
  const [precioMin,          setPrecioMin]    = useState('');
  const [precioMax,          setPrecioMax]    = useState('');
  const [orden,              setOrden]        = useState('reciente');

  // ── DROPDOWN CATEGORÍA ───────────────────────────────────────────────────────
  const [categoriaHover, setCategoriaHover] = useState(null);
  const [dropVisible,    setDropVisible]    = useState(false);
  const closeTimer = useRef(null);

  // ── PRECIO POPOVER ───────────────────────────────────────────────────────────
  const [precioAbierto, setPrecioAbierto] = useState(false);

  // ── COLORES SELECCIONADOS POR TARJETA ────────────────────────────────────────
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  // ── FETCH ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API}/catalogo`),
      axios.get(`${API}/categorias`),
      axios.get(`${API}/subcategorias`),
    ]).then(([pRes, cRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProductos(pRes.value.data);
      if (cRes.status === 'fulfilled') setCategorias(cRes.value.data);
      if (sRes.status === 'fulfilled') setSubcategorias(sRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // ── CERRAR DROPDOWN AL HACER CLIC FUERA ─────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropVisible(false);
      if (precioRef.current && !precioRef.current.contains(e.target))
        setPrecioAbierto(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── RESETEAR SUBCATEGORÍA AL CAMBIAR CATEGORÍA ───────────────────────────────
  useEffect(() => { setSubcategoria(null); }, [categoriaActiva]);

  // ── SUBCATEGORÍAS DE LA CATEGORÍA EN HOVER ──────────────────────────────────
  const subcatsDelHover = useMemo(() => {
    if (!categoriaHover) return [];
    const nombres = new Set(
      productos
        .filter(p => p.categoria === categoriaHover && p.subcategoria)
        .map(p => p.subcategoria)
    );
    return subcategorias.filter(s => nombres.has(s.nombre));
  }, [categoriaHover, productos, subcategorias]);

  // ── PRECIO MÁX DEL CATÁLOGO ──────────────────────────────────────────────────
  const precioMaxCatalogo = useMemo(() =>
    Math.ceil(Math.max(...productos.map(p => Number(p.precio_base)), 0)),
  [productos]);

  // ── FILTRADO + ORDENADO ──────────────────────────────────────────────────────
  const productosFiltrados = useMemo(() => {
    let lista = productos.filter(p => {
      const texto = busqueda.toLowerCase();
      const coincideTexto =
        !busqueda ||
        p.producto_nombre.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto);
      const coincideCategoria    = !categoriaActiva    || p.categoria    === categoriaActiva;
      const coincideSubcategoria = !subcategoriaActiva || p.subcategoria === subcategoriaActiva;
      const precio = Number(p.precio_base);
      const coincidePrecioMin = !precioMin || precio >= Number(precioMin);
      const coincidePrecioMax = !precioMax || precio <= Number(precioMax);
      return coincideTexto && coincideCategoria && coincideSubcategoria &&
             coincidePrecioMin && coincidePrecioMax;
    });
    if (orden === 'precio_asc')  lista = [...lista].sort((a, b) => a.precio_base - b.precio_base);
    if (orden === 'precio_desc') lista = [...lista].sort((a, b) => b.precio_base - a.precio_base);
    return lista;
  }, [productos, busqueda, categoriaActiva, subcategoriaActiva, precioMin, precioMax, orden]);

  const limpiarFiltros = () => {
    setBusqueda(''); setCategoria(null); setSubcategoria(null);
    setPrecioMin(''); setPrecioMax(''); setOrden('reciente');
  };

  const hayFiltrosActivos =
    busqueda || categoriaActiva || subcategoriaActiva ||
    precioMin || precioMax || orden !== 'reciente';

  // ── HANDLERS DROPDOWN CATEGORÍA ──────────────────────────────────────────────
  const handleCatMouseEnter = (nombre) => {
    clearTimeout(closeTimer.current);
    setCategoriaHover(nombre);
    setDropVisible(true);
  };
  const handleCatMouseLeave = () => {
    closeTimer.current = setTimeout(() => setDropVisible(false), 200);
  };
  const handleDropMouseEnter = () => clearTimeout(closeTimer.current);
  const handleDropMouseLeave = () => {
    closeTimer.current = setTimeout(() => setDropVisible(false), 200);
  };

  const seleccionarCategoria = (nombre) => {
    setCategoria(nombre === categoriaActiva ? null : nombre);
    setDropVisible(false);
  };
  const seleccionarSubcat = (nombre) => {
    setSubcategoria(nombre === subcategoriaActiva ? null : nombre);
    setDropVisible(false);
  };
  const seleccionarColorTarjeta = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };
  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  if (loading) return <div className="catalogo-loading">Cargando productos...</div>;

  return (
    <div className="catalogo-wrapper">

      {/* ══════════════════════════════════════════
          ENCABEZADO: título + conteo
      ══════════════════════════════════════════ */}
      <div className="catalogo-header">
        <h2 className="catalogo-titulo">Catálogo de Productos</h2>
      </div>

      {/* ══════════════════════════════════════════
          BARRA DE CONTROLES: búsqueda + orden + precio + limpiar
      ══════════════════════════════════════════ */}
      <div className="catalogo-topbar">

        {/* Búsqueda */}
        <div className="catalogo-busqueda">
          <span className="catalogo-busqueda__icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="catalogo-busqueda__input"
          />
        </div>

        <div className="catalogo-topbar__sep">|</div>

        {/* Ordenar por */}
        <div className="controles-derecha">
          <span className="controles-label">Ordenar por:</span>
          <select
            value={orden}
            onChange={e => setOrden(e.target.value)}
            className="catalogo-orden"
          >
            {ORDEN_OPCIONES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Precio popover */}
          <div className="precio-wrapper" ref={precioRef}>
            <button
              className={`btn-precio ${(precioMin || precioMax) ? 'btn-precio--activo' : ''}`}
              onClick={() => setPrecioAbierto(o => !o)}
            >
              Rango de precio
              <span className="btn-precio__arrow">▾</span>
              {(precioMin || precioMax) && <span className="filtros-badge" />}
            </button>

            {precioAbierto && (
              <div className="precio-popover">
                <p className="precio-popover__titulo">Rango de precio</p>
                <div className="filtro-precio">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={precioMin}
                    min={0}
                    onChange={e => setPrecioMin(e.target.value)}
                    className="filtro-precio__input"
                  />
                  <span className="filtro-precio__sep">—</span>
                  <input
                    type="number"
                    placeholder="Máx"
                    value={precioMax}
                    min={0}
                    onChange={e => setPrecioMax(e.target.value)}
                    className="filtro-precio__input"
                  />
                </div>
                {precioMaxCatalogo > 0 && (
                  <p className="filtro-precio__rango">
                    Hasta ${precioMaxCatalogo.toFixed(2)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Limpiar filtros */}
          {hayFiltrosActivos && (
            <button className="btn-limpiar-top" onClick={limpiarFiltros}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          NAVBAR CATEGORÍAS (horizontal con dropdown)
      ══════════════════════════════════════════ */}
      <div className="cat-navbar" ref={dropRef}>
        <div className="cat-navbar__chips">

          {/* Todas */}
          <button
            className={`cat-chip ${!categoriaActiva ? 'cat-chip--activo' : ''}`}
            onClick={() => seleccionarCategoria(null)}
          >
            Todas
          </button>

          {categorias.map(cat => {
            const tieneSubs = productos.some(
              p => p.categoria === cat.nombre && p.subcategoria
            );
            return (
              <button
                key={cat.id}
                className={`cat-chip
                  ${categoriaActiva === cat.nombre ? 'cat-chip--activo' : ''}
                  ${categoriaHover === cat.nombre && dropVisible ? 'cat-chip--hover' : ''}
                `}
                onClick={() => seleccionarCategoria(cat.nombre)}
                onMouseEnter={() => tieneSubs && handleCatMouseEnter(cat.nombre)}
                onMouseLeave={handleCatMouseLeave}
              >
                {cat.nombre}
                {tieneSubs && <span className="cat-chip__arrow">›</span>}
              </button>
            );
          })}
        </div>

        {/* Dropdown subcategorías */}
        {dropVisible && subcatsDelHover.length > 0 && (
          <div
            className="cat-dropdown"
            onMouseEnter={handleDropMouseEnter}
            onMouseLeave={handleDropMouseLeave}
          >
            <p className="cat-dropdown__titulo">{categoriaHover}</p>
            <div className="cat-dropdown__items">
              {subcatsDelHover.map(s => (
                <button
                  key={s.id}
                  className={`cat-dropdown__item ${subcategoriaActiva === s.nombre ? 'cat-dropdown__item--activo' : ''}`}
                  onClick={() => seleccionarSubcat(s.nombre)}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chip subcategoría activa */}
      {subcategoriaActiva && (
        <div className="subcat-activa">
          <span>Subcategoría: <strong>{subcategoriaActiva}</strong></span>
          <button onClick={() => setSubcategoria(null)}>✕</button>
        </div>
      )}

      {/* Conteo bajo filtros */}
      <p className="catalogo-conteo">
        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''}
      </p>

      {/* ══════════════════════════════════════════
          GRID DE PRODUCTOS
      ══════════════════════════════════════════ */}
      <div className="catalogo-grid">
        {productosFiltrados.length === 0 ? (
          <p className="catalogo-sin-resultados">No se encontraron productos.</p>
        ) : (
          productosFiltrados.map((prod) => {
            const colorTarjeta = coloresSeleccionados[prod.producto_id] || null;
            const colores      = prod.colores_disponibles || [];

            return (
              <div key={prod.producto_id} className="producto-card">

                {/* Imagen */}
                <div className="producto-card__img-wrapper">
                  <img
                    src={
                      (colorTarjeta &&
                        prod.colores_imagenes?.find(c => c.color === colorTarjeta)?.imagen_url)
                      || prod.imagen_url
                      || 'https://placehold.co/300x200?text=Sin+imagen'
                    }
                    alt={prod.producto_nombre}
                    className="producto-card__img"
                  />
                </div>

                {/* Cuerpo */}
                <div className="producto-card__body">
                  <h3 className="producto-card__nombre">{prod.producto_nombre}</h3>
                  <p  className="producto-card__desc">{prod.descripcion}</p>
                  <p  className="producto-card__precio">
                    ${Number(prod.precio_base).toFixed(2)}
                  </p>

                  {/* Colores disponibles */}
                  {colores.length > 0 && (
                    <div className="producto-card__colores">
                      <div className="producto-card__colores-lista">
                        {colores.map(color => (
                          <button
                            key={color}
                            className={`color-chip ${colorTarjeta === color ? 'color-chip--activo' : ''}`}
                            onClick={() => seleccionarColorTarjeta(prod.producto_id, color)}
                            title={color}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    className="btn-detalle"
                    onClick={() => verDetalle(prod.producto_id)}
                  >
                    Ver detalles 
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