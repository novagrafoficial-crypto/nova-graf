import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/AdminReabastecimiento.css";

const API = import.meta.env.VITE_API_URL;

// ── ProductoCard ──────────────────────────────────────────────────────────────
function ProductoCard({ producto, estadoProducto }) {
  const navigate = useNavigate();

  const handleVariantes = () =>
    navigate(`/admin/stock/${producto.producto_id}/variantes`, {
      state: {
        producto_nombre: producto.producto_nombre,
        categoria:       producto.categoria,
        subcategoria:    producto.subcategoria,
      },
    });

  const handleVentas = () =>
    navigate(`/admin/stock/${producto.producto_id}/ventas`, {
      state: { producto_nombre: producto.producto_nombre },
    });

  const handlePrediccion = () =>
    navigate(`/admin/stock/${producto.producto_id}/prediccion`, {
      state: { producto_nombre: producto.producto_nombre },
    });

  // Badge según estado
  const badge = {
    critico:    { cls: "rb-badge--critico",    txt: "Crítico"    },
    proximo:    { cls: "rb-badge--proximo",    txt: "Próximo"    },
    abastecido: { cls: "rb-badge--abastecido", txt: "Abastecido" },
  }[estadoProducto] ?? { cls: "rb-badge--abastecido", txt: "Abastecido" };

  // Color del número de stock
  const stockNum = Number(producto.stock_total);
  const stockCls =
    stockNum === 0  ? "rb-stock-num--danger" :
    stockNum < 10   ? "rb-stock-num--warn"   :
                      "rb-stock-num--ok";

  return (
    <tr>
      {/* Producto */}
      <td>
        <p className="rb-cell-nombre">{producto.producto_nombre}</p>
        <div className="rb-cell-tags">
          <span className="rb-tag">{producto.categoria}</span>
          {producto.subcategoria && (
            <span className="rb-tag rb-tag--sub">{producto.subcategoria}</span>
          )}
        </div>
      </td>

      {/* Stock */}
      <td className="center">
        <div className="rb-cell-stock">
          <span className={`rb-stock-num ${stockCls}`}>{stockNum}</span>
          <span className="rb-stock-vars">
            {producto.total_variantes} var.
          </span>
        </div>
      </td>

      {/* Estado */}
      <td className="center">
        <span className={`rb-badge ${badge.cls}`}>{badge.txt}</span>
      </td>

      {/* Acciones */}
      <td>
        <div className="rb-cell-actions">
          <button className="rb-btn rb-btn--primary"   onClick={handleVariantes}>
            📋 Detalles
          </button>
          <button className="rb-btn rb-btn--secondary" onClick={handleVentas}>
            📊 Ventas
          </button>
          <button className="rb-btn rb-btn--accent"    onClick={handlePrediccion}>
            🔮 Predecir
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Reabastecimiento ──────────────────────────────────────────────────────────
export default function Reabastecimiento() {
  const [productos,      setProductos]      = useState([]);
  const [categorias,     setCategorias]     = useState([]);
  const [subcategorias,  setSubcategorias]  = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [filtros,        setFiltros]        = useState({
    categoria_id: "", subcategoria_id: "", search: "",
  });
  const [estadosProductos, setEstadosProductos] = useState({});

  // ── Paginación ──
  const [paginaActual, setPaginaActual] = useState(1);
  const PRODUCTOS_POR_PAGINA = 10;

  // Cargar categorías
  useEffect(() => {
    fetch(`${API}/api/admin/reabastecimiento/categorias`)
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => setError("No se pudieron cargar las categorías."));
  }, []);

  // Cargar subcategorías según categoría seleccionada
  useEffect(() => {
    const url = filtros.categoria_id
      ? `${API}/api/admin/reabastecimiento/subcategorias?categoria_id=${filtros.categoria_id}`
      : `${API}/api/admin/reabastecimiento/subcategorias`;
    fetch(url)
      .then((r) => r.json())
      .then(setSubcategorias)
      .catch(() => setSubcategorias([]));
  }, [filtros.categoria_id]);

  // Cargar productos filtrados
  const fetchProductos = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filtros.categoria_id)    params.set("categoria_id",    filtros.categoria_id);
    if (filtros.subcategoria_id) params.set("subcategoria_id", filtros.subcategoria_id);
    if (filtros.search)          params.set("search",          filtros.search);
    fetch(`${API}/api/admin/reabastecimiento/productos?${params}`)
      .then((r) => r.json())
      .then((d) => { setProductos(d); setLoading(false); })
      .catch(() => { setError("Error al cargar los productos."); setLoading(false); });
  }, [filtros]);

  useEffect(() => {
    const t = setTimeout(fetchProductos, 350);
    return () => clearTimeout(t);
  }, [fetchProductos]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  // Cargar predicciones para obtener estado más crítico por producto
  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/reabastecimiento/productos`).then((r) => r.json()),
      fetch(`${API}/api/admin/reabastecimiento/prediccion`).then((r) => r.json()),
    ])
      .then(([productosList, variantes]) => {
        const estadoPorProducto = {};

        productosList.forEach((p) => {
          const s = Number(p.stock_total);
          estadoPorProducto[p.producto_id] =
            s === 0 ? "critico" : s < 10 ? "proximo" : "abastecido";
        });

        variantes.forEach((v) => {
          const pid    = v.producto_id;
          const nuevo  = v.estado;
          const actual = estadoPorProducto[pid];
          if (nuevo === "critico") {
            estadoPorProducto[pid] = "critico";
          } else if (nuevo === "proximo" && actual !== "critico") {
            estadoPorProducto[pid] = "proximo";
          } else if (
            nuevo === "abastecido" &&
            actual !== "critico" &&
            actual !== "proximo"
          ) {
            estadoPorProducto[pid] = "abastecido";
          }
        });

        setEstadosProductos(estadoPorProducto);
      })
      .catch((err) => console.error("Error cargando datos:", err));
  }, []);

  // ── Lógica de paginación ──
  const totalPaginas       = Math.ceil(productos.length / PRODUCTOS_POR_PAGINA);
  const productosPaginados = productos.slice(
    (paginaActual - 1) * PRODUCTOS_POR_PAGINA,
    paginaActual * PRODUCTOS_POR_PAGINA
  );

  const hayFiltros =
    filtros.categoria_id || filtros.subcategoria_id || filtros.search;

  return (
    <div className="rb-page">

      {/* ── Header ── */}
      <header className="rb-header">
        <div>
          <h1 className="rb-title">Predicción de Reabastecimiento</h1>
          <p className="rb-subtitle">Filtra y analiza el inventario por categoría.</p>
        </div>
        <div className="rb-counter">
          <span className="rb-counter__num">{productos.length}</span>
          <span className="rb-counter__label">
            producto{productos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      {/* ── Filtros ── */}
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
            onChange={(e) =>
              setFiltros((f) => ({ ...f, search: e.target.value }))
            }
          />
          {filtros.search && (
            <button
              className="rb-search__clear"
              onClick={() => setFiltros((f) => ({ ...f, search: "" }))}
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filtros.categoria_id}
          onChange={(e) =>
            setFiltros({
              categoria_id:    e.target.value,
              subcategoria_id: "",
              search:          filtros.search,
            })
          }
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>

        <select
          value={filtros.subcategoria_id}
          disabled={!subcategorias.length}
          onChange={(e) =>
            setFiltros((f) => ({ ...f, subcategoria_id: e.target.value }))
          }
        >
          <option value="">Todas las subcategorías</option>
          {subcategorias.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>

        {hayFiltros && (
          <button
            className="rb-clear-btn"
            onClick={() =>
              setFiltros({ categoria_id: "", subcategoria_id: "", search: "" })
            }
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* ── Estados ── */}
      {loading && (
        <div className="rb-state">
          <span className="rb-spinner" />Cargando productos…
        </div>
      )}
      {!loading && error && (
        <div className="rb-state rb-state--error">⚠️ {error}</div>
      )}
      {!loading && !error && productos.length === 0 && (
        <div className="rb-state rb-state--empty">
          <span>📭</span>
          <p>No hay productos con los filtros aplicados.</p>
        </div>
      )}

      {/* ── Tabla ── */}
      {!loading && !error && productos.length > 0 && (
        <div className="rb-table-wrap">
          <table className="rb-table">
            <colgroup>
              <col className="col-producto" />
              <col className="col-stock"    />
              <col className="col-estado"   />
              <col className="col-acciones" />
            </colgroup>

            <thead>
              <tr>
                <th>Producto</th>
                <th className="center">Stock</th>
                <th className="center">Estado</th>
                <th>Operaciones</th>
              </tr>
            </thead>

            <tbody>
              {productosPaginados.map((p) => (
                <ProductoCard
                  key={p.producto_id}
                  producto={p}
                  estadoProducto={estadosProductos[p.producto_id] ?? "abastecido"}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Paginación ── */}
      {!loading && !error && totalPaginas > 1 && (
        <div className="rb-pagination">
          <button
            className="rb-pg-btn"
            disabled={paginaActual === 1}
            onClick={() => setPaginaActual((p) => p - 1)}
          >
            ← Anterior
          </button>

          <div className="rb-pg-nums">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={`rb-pg-num ${num === paginaActual ? "rb-pg-num--active" : ""}`}
                onClick={() => setPaginaActual(num)}
              >
                {num}
              </button>
            ))}
          </div>

          <button
            className="rb-pg-btn"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPaginaActual((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}

    </div>
  );
}