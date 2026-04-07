// src/pages/admin/VentasProducto.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/Admin/VentasProducto.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PERIODOS = [
  { key: "dia",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "30 días" },
  { key: "todo",   label: "Todo" },
];

const PERIODO_LABEL = {
  dia:    "hoy",
  semana: "en los últimos 7 días",
  mes:    "en los últimos 30 días",
  todo:   "en total",
};

// Convierte "2025-04-06T00:00:00Z" o "2025-04-06" a medianoche hora local
// Evita el desfase UTC que hace que "hoy" aparezca como "ayer"
function parseFechaLocal(raw) {
  if (typeof raw === "string" && raw.length >= 10) {
    const [y, m, d] = raw.substring(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  return new Date(raw);
}

// Inicio del período en hora local (00:00:00 del día correspondiente)
function getFechaInicio(periodo) {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);

  if (periodo === "dia")    return hoy;
  if (periodo === "semana") { const d = new Date(hoy); d.setDate(d.getDate() - 6);  return d; }
  if (periodo === "mes")    { const d = new Date(hoy); d.setDate(d.getDate() - 29); return d; }
  return null; // todo
}

// Filtra filas del detalle al período exacto (segunda capa de seguridad)
function filtrarPorPeriodo(detalle, periodo) {
  if (periodo === "todo" || !detalle) return detalle;
  const inicio = getFechaInicio(periodo);
  return detalle.filter((row) => parseFechaLocal(row.fecha) >= inicio);
}

// ─── Fila de la tabla ────────────────────────────────────────────────────────
function FilaVenta({ row, index }) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="vp-tr" style={{ animationDelay: `${index * 35}ms` }}>
      <td className="vp-td vp-td--fecha">
        {parseFechaLocal(row.fecha).toLocaleDateString("es-MX", {
          day: "2-digit", month: "short", year: "numeric",
        })}
      </td>
      <td className="vp-td vp-td--img">
        {!imgError && row.imagen_url ? (
          <img src={row.imagen_url} alt={row.producto} className="vp-thumb" onError={() => setImgError(true)} />
        ) : (
          <div className="vp-thumb vp-thumb--empty">📷</div>
        )}
      </td>
      <td className="vp-td">{row.producto}</td>
      <td className="vp-td">
        <span className="vp-color-dot" style={{ backgroundColor: row.color_hex || "#4f7cff" }} />
        {row.color}
      </td>
      <td className="vp-td vp-td--desc">
        {row.atributos ? (
          row.atributos.split(", ").map((a, j) => <span key={j} className="vp-attr">{a}</span>)
        ) : (
          <span className="vp-muted">—</span>
        )}
      </td>
      <td className="vp-td vp-td--qty">
        <strong>{row.cantidad_vendida}</strong> uds.
      </td>
    </tr>
  );
}

// ─── Tarjeta producto más vendido ────────────────────────────────────────────
function TopProductoCard({ detalle, periodo }) {
  const [imgError, setImgError] = useState(false);

  const top = useMemo(() => {
    const filasFiltradas = filtrarPorPeriodo(detalle, periodo);
    if (!filasFiltradas || filasFiltradas.length === 0) return null;

    const mapa = {};
    for (const row of filasFiltradas) {
      const key = `${row.producto}||${row.color}||${row.imagen_url}||${row.color_hex}||${row.atributos}`;
      if (!mapa[key]) {
        mapa[key] = {
          producto: row.producto, color: row.color, color_hex: row.color_hex,
          imagen_url: row.imagen_url, atributos: row.atributos, total: 0,
        };
      }
      mapa[key].total += Number(row.cantidad_vendida) || 0;
    }

    const lista = Object.values(mapa);
    lista.sort((a, b) => b.total - a.total);
    return lista[0] || null;
  }, [detalle, periodo]);

  if (!top) return null;

  return (
    <div className="vp-top-card">
      <div className="vp-top-card__header">
        <span className="vp-top-card__badge">🏆 Producto más vendido</span>
        <span className="vp-top-card__periodo">{PERIODO_LABEL[periodo]}</span>
      </div>
      <div className="vp-top-card__body">
        <div className="vp-top-card__img-wrap">
          {!imgError && top.imagen_url ? (
            <img src={top.imagen_url} alt={top.producto} className="vp-top-card__img" onError={() => setImgError(true)} />
          ) : (
            <div className="vp-top-card__img vp-top-card__img--empty">📷</div>
          )}
        </div>
        <div className="vp-top-card__info">
          <h3 className="vp-top-card__nombre">{top.producto}</h3>
          <div className="vp-top-card__meta">
            <span className="vp-top-card__meta-item">
              <span className="vp-color-dot" style={{ backgroundColor: top.color_hex || "#4f7cff" }} />
              {top.color}
            </span>
            {top.atributos && (
              <span className="vp-top-card__meta-item vp-top-card__attrs">
                {top.atributos.split(", ").map((a, i) => <span key={i} className="vp-attr">{a}</span>)}
              </span>
            )}
          </div>
        </div>
        <div className="vp-top-card__qty">
          <span className="vp-top-card__qty-num">{top.total}</span>
          <span className="vp-top-card__qty-label">unidades vendidas</span>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VentasProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const productoNombre = location.state?.producto_nombre ?? "Producto";

  const [periodo, setPeriodo] = useState("mes");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${id}/ventas?periodo=${periodo}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => {
        setData({
          detalle: Array.isArray(d.detalle) ? d.detalle : [],
          serie:   Array.isArray(d.serie)   ? d.serie   : [],
        });
        setLoading(false);
        setPaginaActual(1);
      })
      .catch((err) => { setError(`Error al cargar las ventas. (${err.message})`); setLoading(false); });
  }, [id, periodo]);

  const totalFilas   = data?.detalle.length ?? 0;
  const totalPaginas = Math.ceil(totalFilas / itemsPorPagina);
  const inicio       = (paginaActual - 1) * itemsPorPagina;
  const filasPagina  = data?.detalle.slice(inicio, inicio + itemsPorPagina) ?? [];

  const cambiarPagina = (n) => { if (n >= 1 && n <= totalPaginas) setPaginaActual(n); };

  const handleVerGrafica = () => {
    navigate(`/admin/ventas/${id}/grafica?periodo=${periodo}`, {
      state: { producto_nombre: productoNombre },
    });
  };

  return (
    <div className="vp-page">
      <div className="vp-back">
        <button className="vp-back__btn" onClick={() => navigate(-1)}>← Volver</button>
        <span className="vp-back__sep">/</span>
        <span className="vp-back__txt">{productoNombre}</span>
        <span className="vp-back__sep">/</span>
        <span className="vp-back__current">Ventas</span>
      </div>

      <header className="vp-header">
        <div>
          <h1 className="vp-title">{productoNombre}</h1>
          <p className="vp-subtitle">Análisis de ventas por período</p>
        </div>
        <div className="vp-periodos">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`vp-periodo-btn${periodo === p.key ? " vp-periodo-btn--active" : ""}`}
              onClick={() => setPeriodo(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="vp-state"><span className="vp-spinner" /> Cargando ventas…</div>}
      {!loading && error && <div className="vp-state vp-state--error">⚠️ {error}</div>}

      {!loading && data && (
        <>
          {data.serie.length > 0 && (
            <div className="vp-toggle-graph">
              <button className="vp-toggle-graph__btn" onClick={handleVerGrafica}>
                📊 Ver gráfica de ventas
              </button>
            </div>
          )}

          {data.detalle.length > 0 && (
            <TopProductoCard detalle={data.detalle} periodo={periodo} />
          )}

          <div className="vp-table-section">
            <h2 className="vp-section-title">📋 Detalle de ventas</h2>
            <div className="vp-table-wrap">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>FECHA</th><th>IMAGEN</th><th>PRODUCTO</th>
                    <th>COLOR</th><th>DESCRIPCIÓN DE PRODUCTO</th><th>CANTIDAD VENDIDA</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPagina.map((row, i) => <FilaVenta key={i} row={row} index={i} />)}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="vp-pagination">
                <button className="vp-pagination__btn" disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)}>← Anterior</button>
                <span className="vp-pagination__info">Página {paginaActual} de {totalPaginas}</span>
                <button className="vp-pagination__btn" disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)}>Siguiente →</button>
              </div>
            )}
          </div>

          {data.serie.length === 0 && (
            <div className="vp-state vp-state--empty">
              <span>📭</span>
              <p>No hay ventas registradas en este período.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}