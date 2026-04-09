// frontend/src/pages/Client/CatalogoCliente.jsx
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/CatalogoCliente.css';

// ✅ 1. Definimos la URL base usando la variable de entorno
const API_BASE = import.meta.env.VITE_API_URL;
const API_ENDPOINT = `${API_BASE}/api/client/productos`;

const ORDEN_OPCIONES = [
  { value: 'reciente',    label: 'Más reciente' },
  { value: 'precio_asc',  label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
];

const CatalogoCliente = () => {
  const navigate = useNavigate();
  const precioRef = useRef(null);

  // ── DATOS ─────────────────────────────────────────
  const [productos,     setProductos]     = useState([]);
  const [categorias,    setCategorias]    = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // ── FILTROS ──────────────────────────────────────
  const [busqueda,           setBusqueda]     = useState('');
  const [categoriaId,        setCategoriaId]  = useState('');
  const [subcategoriaId,     setSubcategoriaId] = useState('');
  const [precioMin,          setPrecioMin]    = useState('');
  const [precioMax,          setPrecioMax]    = useState('');
  const [orden,              setOrden]        = useState('reciente');
  const [precioAbierto,      setPrecioAbierto] = useState(false);

  // ── COLORES POR TARJETA ─────────────────────────
  const [coloresSeleccionados, setColoresSeleccionados] = useState({});

  // ── FETCH INICIAL ────────────────────────────────
  useEffect(() => {
    // ✅ 2. Usamos API_ENDPOINT para las peticiones
    Promise.allSettled([
      axios.get(`${API_ENDPOINT}/catalogo`),
      axios.get(`${API_ENDPOINT}/categorias`),
      axios.get(`${API_ENDPOINT}/subcategorias`),
    ]).then(([pRes, cRes, sRes]) => {
      if (pRes.status === 'fulfilled') setProductos(pRes.value.data);
      if (cRes.status === 'fulfilled') setCategorias(cRes.value.data);
      if (sRes.status === 'fulfilled') setSubcategorias(sRes.value.data);
    }).catch(err => {
      console.error("Error cargando el catálogo:", err);
    }).finally(() => setLoading(false));
  }, []);

  // ── CARGAR SUBCATEGORÍAS DEPENDIENTES ────────────
  const subcategoriasFiltradas = useMemo(() => {
    if (!categoriaId) return [];
    const catNombre = categorias.find(c => c.id == categoriaId)?.nombre;
    if (!catNombre) return [];
    const nombresSet = new Set(
      productos
        .filter(p => p.categoria === catNombre && p.subcategoria)
        .map(p => p.subcategoria)
    );
    return subcategorias.filter(s => nombresSet.has(s.nombre));
  }, [categoriaId, productos, subcategorias, categorias]);

  // ── RESETEAR SUBCATEGORÍA AL CAMBIAR CATEGORÍA ───
  useEffect(() => {
    setSubcategoriaId('');
  }, [categoriaId]);

  // ── PRECIO MÁXIMO DEL CATÁLOGO ───────────────────
  const precioMaxCatalogo = useMemo(() =>
    productos.length > 0 
      ? Math.ceil(Math.max(...productos.map(p => Number(p.precio_base)), 0)) 
      : 0,
  [productos]);

  // ── FILTRADO Y ORDENADO ──────────────────────────
  const productosFiltrados = useMemo(() => {
    let lista = [...productos].filter(p => {
      const texto = busqueda.toLowerCase();
      const matchTexto = !busqueda ||
        p.producto_nombre.toLowerCase().includes(texto) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(texto));

      const catNombre = categorias.find(c => c.id == categoriaId)?.nombre;
      const matchCategoria = !categoriaId || p.categoria === catNombre;

      const subNombre = subcategorias.find(s => s.id == subcategoriaId)?.nombre;
      const matchSubcategoria = !subcategoriaId || p.subcategoria === subNombre;

      const precio = Number(p.precio_base);
      const matchMin = !precioMin || precio >= Number(precioMin);
      const matchMax = !precioMax || precio <= Number(precioMax);

      return matchTexto && matchCategoria && matchSubcategoria && matchMin && matchMax;
    });

    if (orden === 'precio_asc')  lista.sort((a,b) => a.precio_base - b.precio_base);
    if (orden === 'precio_desc') lista.sort((a,b) => b.precio_base - a.precio_base);
    return lista;
  }, [productos, busqueda, categoriaId, subcategoriaId, precioMin, precioMax, orden, categorias, subcategorias]);

  const hayFiltrosActivos = busqueda || categoriaId || subcategoriaId || precioMin || precioMax || orden !== 'reciente';

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaId('');
    setSubcategoriaId('');
    setPrecioMin('');
    setPrecioMax('');
    setOrden('reciente');
  };

  // ── HANDLERS ─────────────────────────────────────
  const seleccionarColorTarjeta = (productoId, color) => {
    setColoresSeleccionados(prev => ({ ...prev, [productoId]: color }));
  };

  const verDetalle = (productoId) => {
    const color = coloresSeleccionados[productoId] || '';
    navigate(`/cliente/producto/${productoId}`, { state: { colorSeleccionado: color } });
  };

  // Cerrar popover de precio al hacer clic fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (precioRef.current && !precioRef.current.contains(e.target))
        setPrecioAbierto(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) return <div className="catalogo-loading">Cargando productos...</div>;

  return (
    <div className="catalogo-wrapper">
      <div className="catalogo-header">
        <h2 className="catalogo-titulo">Elige tu producto base</h2>
        <span className="catalogo-conteo-header">{productosFiltrados.length} productos</span>
      </div>

      <div className="catalogo-filtros">
        <div className="catalogo-busqueda">
          <span className="catalogo-busqueda__icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={categoriaId}
          onChange={e => setCategoriaId(e.target.value)}
          className="catalogo-select"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
          ))}
        </select>

        <select
          value={subcategoriaId}
          onChange={e => setSubcategoriaId(e.target.value)}
          disabled={!categoriaId || subcategoriasFiltradas.length === 0}
          className="catalogo-select"
        >
          <option value="">Todas las subcategorías</option>
          {subcategoriasFiltradas.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
          ))}
        </select>

        <select
          value={orden}
          onChange={e => setOrden(e.target.value)}
          className="catalogo-select"
        >
          {ORDEN_OPCIONES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="precio-wrapper" ref={precioRef}>
          <button
            className={`btn-precio ${(precioMin || precioMax) ? 'activo' : ''}`}
            onClick={() => setPrecioAbierto(!precioAbierto)}
          >
            Rango de precio <span className="arrow">▼</span>
          </button>
          {precioAbierto && (
            <div className="precio-popover">
              <div className="precio-popover__campos">
                <input
                  type="number"
                  placeholder="Mín $"
                  value={precioMin}
                  onChange={e => setPrecioMin(e.target.value)}
                />
                <span>—</span>
                <input
                  type="number"
                  placeholder="Máx $"
                  value={precioMax}
                  onChange={e => setPrecioMax(e.target.value)}
                />
              </div>
              <p className="precio-popover__max">Hasta ${precioMaxCatalogo.toFixed(2)}</p>
            </div>
          )}
        </div>

        {hayFiltrosActivos && (
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {productosFiltrados.length === 0 ? (
        <div className="catalogo-sin-resultados">No se encontraron productos.</div>
      ) : (
        <div className="catalogo-grid">
          {productosFiltrados.map(prod => {
            const colorTarjeta = coloresSeleccionados[prod.producto_id] || null;
            const colores = prod.colores_disponibles || [];
            return (
              <div key={prod.producto_id} className="producto-card">
                <div className="producto-card__img-wrapper">
                  <img
                    src={
                      (colorTarjeta &&
                        prod.colores_imagenes?.find(c => c.color === colorTarjeta)?.imagen_url)
                      || prod.imagen_url
                      || 'https://placehold.co/300x200?text=Sin+imagen'
                    }
                    alt={prod.producto_nombre}
                  />
                </div>
                <div className="producto-card__body">
                  <h3>{prod.producto_nombre}</h3>
                  <p className="desc">{prod.descripcion}</p>
                  <p className="precio">${Number(prod.precio_base).toFixed(2)}</p>
                  {colores.length > 0 && (
                    <div className="colores">
                      <span className="colores-label">Colores:</span>
                      <div className="colores-lista">
                        {colores.map(color => (
                          <button
                            key={color}
                            className={`color-chip ${colorTarjeta === color ? 'activo' : ''}`}
                            onClick={() => seleccionarColorTarjeta(prod.producto_id, color)}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="btn-detalle" onClick={() => verDetalle(prod.producto_id)}>
                    Ver detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CatalogoCliente;