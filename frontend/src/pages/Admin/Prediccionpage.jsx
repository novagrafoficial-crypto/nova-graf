// src/pages/Admin/PrediccionProducto.jsx
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/admin/Prediccionpage.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ESTADOS = [
  { key: "todos",      label: "Todos",       icon: "◈" },
  { key: "critico",    label: "Crítico",     icon: "🔴" },
  { key: "proximo",    label: "Próximos",    icon: "🟡" },
  { key: "abastecido", label: "Abastecidos", icon: "🟢" },
];

const ITEMS_PER_PAGE = 10;

const fmtDias = (dias) => {
  if (dias === null || dias === undefined) return "—";
  if (!isFinite(dias) || dias > 9999)     return "∞";
  if (dias < 0)                           return "Ya superó ROP";
  return `${Math.ceil(dias)} días`;
};

const badgeEstado = (estado) => {
  const map = {
    critico:    { label: "Crítico",    cls: "badge--critico" },
    proximo:    { label: "Próximo",    cls: "badge--proximo" },
    abastecido: { label: "Abastecido", cls: "badge--abastecido" },
  };
  const b = map[estado] ?? { label: estado, cls: "" };
  return <span className={`pp-badge ${b.cls}`}>{b.label}</span>;
};

export default function PrediccionProducto() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const productoNombre = location.state?.producto_nombre ?? "Producto";

  const [variantes,     setVariantes]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [filtroEstado,  setFiltroEstado]  = useState("todos");
  const [sortKey,       setSortKey]       = useState("dias_hasta_rop");
  const [sortDir,       setSortDir]       = useState("asc");
  const [paginaActual,  setPaginaActual]  = useState(1);

  useEffect(() => {
    setLoading(true); setError(null);
    fetch(`${API}/api/admin/reabastecimiento/prediccion`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { setVariantes(data.filter((v) => v.producto_id == id)); setLoading(false); })
      .catch((e)  => { setError(e.message); setLoading(false); });
  }, [id]);

  const conteos = useMemo(() => ({
    todos:      variantes.length,
    critico:    variantes.filter(v => v.estado === "critico").length,
    proximo:    variantes.filter(v => v.estado === "proximo").length,
    abastecido: variantes.filter(v => v.estado === "abastecido").length,
  }), [variantes]);

  const listaFiltrada = useMemo(() => {
    let arr = filtroEstado !== "todos"
      ? variantes.filter(v => v.estado === filtroEstado)
      : [...variantes];

    arr.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "dias_hasta_rop") {
        av = av === null ? Infinity : Number(av);
        bv = bv === null ? Infinity : Number(bv);
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [variantes, filtroEstado, sortKey, sortDir]);

  const totalPaginas = Math.ceil(listaFiltrada.length / ITEMS_PER_PAGE);
  const inicio       = (paginaActual - 1) * ITEMS_PER_PAGE;
  const listaPagina  = listaFiltrada.slice(inicio, inicio + ITEMS_PER_PAGE);

  useEffect(() => { setPaginaActual(1); }, [filtroEstado, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <span className="pp-sort-icon pp-sort-icon--neutral">⇅</span>;
    return <span className="pp-sort-icon">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="pp-page">

      {/* Breadcrumb */}
      <div className="pp-breadcrumb">
        <button className="pp-back" onClick={() => navigate(-1)}>← Volver</button>
        <span className="pp-sep">/</span>
        <span className="pp-crumb">{productoNombre}</span>
        <span className="pp-sep">/</span>
        <span className="pp-crumb pp-crumb--active">Predicción</span>
      </div>

      <header className="pp-header">
        <div>
          <h1 className="pp-title">{productoNombre}</h1>
          <p className="pp-subtitle">Predicción de reabastecimiento por variante</p>
        </div>
      </header>

      {/* Tarjetas resumen */}
      <div className="pp-summary">
        {ESTADOS.map(({ key, label, icon }) => (
          <button key={key}
            className={`pp-summary-card pp-summary-card--${key}${filtroEstado === key ? " pp-summary-card--active" : ""}`}
            onClick={() => setFiltroEstado(key)}>
            <span className="pp-summary-icon">{icon}</span>
            <span className="pp-summary-count">{conteos[key]}</span>
            <span className="pp-summary-label">{label}</span>
          </button>
        ))}
      </div>

      {filtroEstado !== "todos" && (
        <div className="pp-clear-state">
          <button className="pp-clear-filters" onClick={() => { setFiltroEstado("todos"); setPaginaActual(1); }}>
            ✕ Mostrar todos los estados
          </button>
        </div>
      )}

      {loading  && <div className="pp-state"><span className="pp-spinner" />Calculando predicciones…</div>}
      {!loading && error && <div className="pp-state pp-state--error">⚠️ {error}</div>}

      {!loading && !error && (
        <div className="pp-table-wrap">
          {listaFiltrada.length === 0 ? (
            <div className="pp-empty">
              <span className="pp-empty-icon">📭</span>
              <p>No hay variantes para el estado seleccionado.</p>
            </div>
          ) : (
            <>
              <table className="pp-table">
                <thead>
                  <tr>
                    {/* ── Columnas ajustadas ── */}
                    <th className="pp-th">Producto</th>
                    <th className="pp-th pp-th--sortable" onClick={() => toggleSort("color")}>
                      Color {sortIcon("color")}
                    </th>
                    <th className="pp-th">Características Producto</th>
                    <th className="pp-th pp-th--sortable pp-th--num" onClick={() => toggleSort("stock_actual")}>
                      Stock actual {sortIcon("stock_actual")}
                    </th>
                    <th className="pp-th pp-th--num">ROP (mínimo)</th>
                    <th className="pp-th pp-th--sortable pp-th--num" onClick={() => toggleSort("dias_hasta_rop")}>
                      Días hasta ROP {sortIcon("dias_hasta_rop")}
                    </th>
                    <th className="pp-th pp-th--center">Estado</th>
                    <th className="pp-th pp-th--center">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {listaPagina.map((v) => (
                    <tr key={v.variante_id} className={`pp-tr pp-tr--${v.estado}`}>

                      {/* Nombre del producto */}
                      <td className="pp-td">
                        <span className="pp-product-name">{v.producto_nombre}</span>
                      </td>

                      {/* Color con punto */}
                      <td className="pp-td">
                        <div className="pp-color-wrap">
                          <span className="pp-color-dot" style={{
                            background: v.color?.toLowerCase() === "multicolor"
                              ? "linear-gradient(135deg,#f00,#0f0,#00f)"
                              : v.color?.toLowerCase() ?? "#aaa"
                          }} />
                          <span>{v.color}</span>
                        </div>
                      </td>

                      {/* Atributos como chips */}
                      <td className="pp-td pp-td--attrs">
                        {v.atributos
                          ? v.atributos.split(", ").map((a, i) => (
                              <span key={i} className="pp-attr-chip">{a}</span>
                            ))
                          : <span className="pp-muted">—</span>}
                      </td>

                      {/* Stock actual */}
                      <td className="pp-td pp-td--num">
                        <span className={`pp-stock${v.stock_actual <= v.rop ? " pp-stock--low" : ""}`}>
                          {v.stock_actual}
                        </span>
                        <span className="pp-unit"> uds.</span>
                      </td>

                      {/* ROP */}
                      <td className="pp-td pp-td--num">
                        {v.rop}<span className="pp-unit"> uds.</span>
                      </td>

                      {/* Días hasta ROP */}
                      <td className="pp-td pp-td--num">
                        <span className={`pp-dias${
                          v.dias_hasta_rop !== null && v.dias_hasta_rop <= 3 ? " pp-dias--urgente" :
                          v.dias_hasta_rop !== null && v.dias_hasta_rop <= 7 ? " pp-dias--alerta" : ""
                        }`}>
                          {fmtDias(v.dias_hasta_rop)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="pp-td pp-td--center">{badgeEstado(v.estado)}</td>

                      {/* Botón detalle */}
                      <td className="pp-td pp-td--center">
                        <button
                          className="pp-btn-detail"
                          onClick={() => navigate(`/admin/prediccion/variante/${v.variante_id}`, { state: { variante: v } })}
                        >
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPaginas > 1 && (
                <div className="pp-pagination">
                  <button className="pp-pagination__btn"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => p - 1)}>← Anterior</button>
                  <span className="pp-pagination__info">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button className="pp-pagination__btn"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => p + 1)}>Siguiente →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}