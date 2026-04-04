// src/pages/Admin/PrediccionModal.jsx
// ─── Convertido de modal a página completa ───────────────────────────────────
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/Admin/PrediccionModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PERIODOS = [
  { key: "dia",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "30 días" },
  { key: "todo",   label: "Todo" },
];

// ─── Misma lógica de cálculo que tenías ───────────────────────────────────────
const calcular = (base, lead) => {
  if (!base) return null;
  const promedio  = Number(base.ventas_promedio_diarias);
  const maxDiario = Number(base.demanda_maxima_diaria);
  const stock     = Number(base.stock_actual);

  const stockSeguridad  = Math.ceil(Math.max(0, (maxDiario - promedio) * lead));
  const puntoReorden    = Math.ceil((promedio * lead) + stockSeguridad);
  const diasAgotamiento = promedio > 0 ? (stock / promedio).toFixed(1) : "∞";
  const cantidadPedido  = Math.ceil((promedio * lead) * 2);

  return { stockSeguridad, puntoReorden, diasAgotamiento, cantidadPedido };
};

// ─── Página (antes era modal) ─────────────────────────────────────────────────
export default function PrediccionModal() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // El nombre viene por navigate(..., { state: { producto_nombre } })
  const productoNombre = location.state?.producto_nombre ?? "Producto";

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [data,     setData]     = useState(null);
  const [leadTime, setLeadTime] = useState(7);
  const [periodo,  setPeriodo]  = useState("mes");

  const indicadores = data ? calcular(data, leadTime) : null;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${id}/prediccion?periodo=${periodo}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d)  => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id, periodo]);

  return (
    <div className="pm-page">

      {/* ── Breadcrumb ── */}
      <div className="pm-breadcrumb">
        <button className="pm-back" onClick={() => navigate(-1)}>← Volver</button>
        <span className="pm-sep">/</span>
        <span className="pm-crumb pm-crumb--muted">{productoNombre}</span>
        <span className="pm-sep">/</span>
        <span className="pm-crumb pm-crumb--active">Predicción</span>
      </div>

      {/* ── Header ── */}
      <div className="pm-header">
        <div>
          <h2 className="pm-title">🔮 Predicción de Reabastecimiento</h2>
          <p className="pm-subtitle">{productoNombre}</p>
        </div>

        {/* Selector de período */}
        <div className="pm-periodos">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`pm-periodo-btn${periodo === p.key ? " pm-periodo-btn--active" : ""}`}
              onClick={() => setPeriodo(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Estados ── */}
      {loading && (
        <div className="pm-state">
          <span className="pm-spinner" /> Cargando datos...
        </div>
      )}
      {!loading && error && (
        <div className="pm-state pm-state--error">⚠️ {error}</div>
      )}

      {/* ── Contenido ── */}
      {!loading && data && (
        <div className="pm-body">

          {/* Stats */}
          <div className="pm-stats">
            <div className="pm-stat-card">
              <span className="pm-stat-label">Stock actual</span>
              <span className="pm-stat-value">{data.stock_actual} uds.</span>
            </div>
            <div className="pm-stat-card">
              <span className="pm-stat-label">Ventas totales ({periodo})</span>
              <span className="pm-stat-value">{data.ventas_totales_periodo} uds.</span>
            </div>
            <div className="pm-stat-card">
              <span className="pm-stat-label">Días con ventas</span>
              <span className="pm-stat-value">{data.dias_con_ventas}</span>
            </div>
            <div className="pm-stat-card">
              <span className="pm-stat-label">Promedio diario</span>
              <span className="pm-stat-value">{data.ventas_promedio_diarias} uds/día</span>
            </div>
            <div className="pm-stat-card">
              <span className="pm-stat-label">Demanda máxima diaria</span>
              <span className="pm-stat-value">{data.demanda_maxima_diaria} uds.</span>
            </div>
          </div>

          {/* Lead time */}
          <div className="pm-param">
            <label>🚚 Tiempo de entrega del proveedor (días):</label>
            <div className="pm-param__ctrl">
              <button onClick={() => setLeadTime((v) => Math.max(1, v - 1))}>−</button>
              <input
                type="number"
                min="1"
                step="1"
                value={leadTime}
                onChange={(e) => setLeadTime(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <button onClick={() => setLeadTime((v) => v + 1)}>+</button>
              <span className="pm-param__unit">días</span>
            </div>
            <p className="pm-param__hint">Los indicadores se recalculan automáticamente.</p>
          </div>

          {/* Resultados */}
          {indicadores && (
            <div className="pm-resultados">
              <div className="pm-result-card">
                <span className="pm-result-label">📦 Stock de seguridad</span>
                <span className="pm-result-value">{indicadores.stockSeguridad} uds.</span>
                <span className="pm-result-desc">Inventario extra para imprevistos</span>
              </div>
              <div className="pm-result-card">
                <span className="pm-result-label">⚠️ Punto de reorden</span>
                <span className="pm-result-value">{indicadores.puntoReorden} uds.</span>
                <span className="pm-result-desc">Cuando el stock baje a este nivel, haz un pedido</span>
              </div>
              <div className="pm-result-card">
                <span className="pm-result-label">⏳ Días hasta agotar stock</span>
                <span
                  className="pm-result-value"
                  style={{
                    color: indicadores.diasAgotamiento === "∞" ? "#22c55e"
                      : Number(indicadores.diasAgotamiento) <= leadTime ? "#ef4444"
                      : "#22c55e"
                  }}
                >
                  {indicadores.diasAgotamiento} días
                </span>
                <span className="pm-result-desc">Con el ritmo de ventas actual</span>
              </div>
              <div className="pm-result-card">
                <span className="pm-result-label">🛒 Cantidad sugerida de pedido</span>
                <span className="pm-result-value">{indicadores.cantidadPedido} uds.</span>
                <span className="pm-result-desc">Para cubrir 2 ciclos de entrega</span>
              </div>
            </div>
          )}

          {/* Alertas */}
          {indicadores && indicadores.diasAgotamiento !== "∞" && Number(indicadores.diasAgotamiento) <= leadTime && (
            <div className="pm-alert pm-alert--danger">
              🚨 <strong>Alerta:</strong> El stock se agotará en {indicadores.diasAgotamiento} días,
              antes de que llegue el pedido ({leadTime} días). <strong>Haz un pedido inmediatamente.</strong>
            </div>
          )}

          {/* Nota */}
          <div className="pm-note">
            <small>
              📐 Fórmulas: Stock seguridad = (demanda_max − promedio) × lead_time |
              Punto de reorden = (promedio × lead_time) + stock_seguridad
            </small>
          </div>
        </div>
      )}
    </div>
  );
}