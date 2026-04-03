// src/pages/admin/Reabastecimiento.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import VariantesModal from "./Variantesmodal";
import PrediccionModal from "./PrediccionModal";
import "../../styles/Admin/AdminReabastecimiento.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ProductoCard({ producto, onVerProducto, onVerPrediccion }) {
  const navigate = useNavigate();

  const handleVentas = () =>
    navigate(`/admin/stock/${producto.producto_id}/ventas`, {
      state: { producto_nombre: producto.producto_nombre },
    });

  return (
    <div className="rb-list-item">
      <div className="rb-list-item__main">
        <h3 className="rb-list-item__nombre">{producto.producto_nombre}</h3>
        <div className="rb-list-item__cats">
          <span className="rb-tag">{producto.categoria}</span>
          {producto.subcategoria && <span className="rb-tag rb-tag--sub">{producto.subcategoria}</span>}
        </div>
      </div>

      <div className="rb-list-item__stats">
        <span
          className="rb-list-item__stock"
          style={{
            color:
              Number(producto.stock_total) === 0
                ? "var(--rb-danger)"
                : Number(producto.stock_total) < 10
                ? "var(--rb-warn)"
                : "var(--rb-ok)",
          }}
        >
          {Number(producto.stock_total)} uds.
        </span>
        <span className="rb-list-item__vars">
          {producto.total_variantes} variante{producto.total_variantes !== "1" ? "s" : ""}
        </span>
      </div>

      <div className="rb-list-item__actions">
        <button className="rb-btn rb-btn--primary" onClick={() => onVerProducto(producto)}>
          📋 Ver productos
        </button>
        <button className="rb-btn rb-btn--secondary" onClick={handleVentas}>
          📊 Ver ventas
        </button>
        <button className="rb-btn rb-btn--accent" onClick={() => onVerPrediccion(producto)}>
          🔮 Ver predicción
        </button>
      </div>
    </div>
  );
}

export default function Reabastecimiento() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productoSel, setProductoSel] = useState(null);
  const [productoPrediccion, setProductoPrediccion] = useState(null);
  const [filtros, setFiltros] = useState({ categoria_id: "", subcategoria_id: "", search: "" });

  useEffect(() => {
    fetch(`${API}/api/admin/reabastecimiento/categorias`)
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => setError("No se pudieron cargar las categorías."));
  }, []);

  useEffect(() => {
    const url = filtros.categoria_id
      ? `${API}/api/admin/reabastecimiento/subcategorias?categoria_id=${filtros.categoria_id}`
      : `${API}/api/admin/reabastecimiento/subcategorias`;
    fetch(url)
      .then((r) => r.json())
      .then(setSubcategorias)
      .catch(() => setSubcategorias([]));
  }, [filtros.categoria_id]);

  const fetchProductos = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filtros.categoria_id) params.set("categoria_id", filtros.categoria_id);
    if (filtros.subcategoria_id) params.set("subcategoria_id", filtros.subcategoria_id);
    if (filtros.search) params.set("search", filtros.search);
    fetch(`${API}/api/admin/reabastecimiento/productos?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProductos(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar los productos.");
        setLoading(false);
      });
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(fetchProductos, 350);
    return () => clearTimeout(t);
  }, [fetchProductos]);

  const hayFiltros = filtros.categoria_id || filtros.subcategoria_id || filtros.search;

  return (
    <div className="rb-page">
      {productoSel && <VariantesModal producto={productoSel} onClose={() => setProductoSel(null)} />}
      {productoPrediccion && (
        <PrediccionModal producto={productoPrediccion} onClose={() => setProductoPrediccion(null)} />
      )}

      <header className="rb-header">
        <div>
          <h1 className="rb-title">Predicción de Reabastecimiento</h1>
          <p className="rb-subtitle">Filtra y analiza el inventario por categoría.</p>
        </div>
        <div className="rb-counter">
          <span className="rb-counter__num">{productos.length}</span>
          <span className="rb-counter__label">producto{productos.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <div className="rb-filters">
        <div className="rb-search">
          <svg viewBox="0 0 20 20" fill="none" className="rb-search__icon">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o marca…"
            value={filtros.search}
            onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
          />
          {filtros.search && (
            <button className="rb-search__clear" onClick={() => setFiltros((f) => ({ ...f, search: "" }))}>
              ✕
            </button>
          )}
        </div>
        <select
          value={filtros.categoria_id}
          onChange={(e) =>
            setFiltros({ categoria_id: e.target.value, subcategoria_id: "", search: filtros.search })
          }
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtros.subcategoria_id}
          disabled={!subcategorias.length}
          onChange={(e) => setFiltros((f) => ({ ...f, subcategoria_id: e.target.value }))}
        >
          <option value="">Todas las subcategorías</option>
          {subcategorias.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        {hayFiltros && (
          <button
            className="rb-clear-btn"
            onClick={() => setFiltros({ categoria_id: "", subcategoria_id: "", search: "" })}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {loading && (
        <div className="rb-state">
          <span className="rb-spinner" />
          Cargando productos…
        </div>
      )}
      {!loading && error && <div className="rb-state rb-state--error">⚠️ {error}</div>}
      {!loading && !error && productos.length === 0 && (
        <div className="rb-state rb-state--empty">
          <span>📭</span>
          <p>No hay productos con los filtros aplicados.</p>
        </div>
      )}
      {!loading && !error && productos.length > 0 && (
        <>
          <div className="rb-list-header">
            <div className="rb-list-header__producto">Producto</div>
            <div className="rb-list-header__stock">Stock disponible</div>
            <div className="rb-list-header__operaciones">Operaciones</div>
          </div>
          <div className="rb-grid">
            {productos.map((p) => (
              <ProductoCard
                key={p.producto_id}
                producto={p}
                onVerProducto={setProductoSel}
                onVerPrediccion={setProductoPrediccion}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}