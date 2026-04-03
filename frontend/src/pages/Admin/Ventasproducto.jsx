// src/pages/admin/VentasProducto.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart,  Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart,  Pie, Cell,
} from "recharts";
import "../../styles/Admin/VentasProducto.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PERIODOS = [
  { key: "dia",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "30 días" },
  { key: "todo",   label: "Todo" },
];

const COLORS = ["#4f7cff","#22c55e","#f59e0b","#ef4444","#9b59f7","#06b6d4","#ec4899","#84cc16"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="vp-tooltip">
      <p className="vp-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="vp-kpi" style={{ borderTopColor: color }}>
      <span className="vp-kpi__val" style={{ color }}>{value}</span>
      <span className="vp-kpi__label">{label}</span>
      {sub && <span className="vp-kpi__sub">{sub}</span>}
    </div>
  );
}

export default function VentasProducto() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const productoNombre = location.state?.producto_nombre ?? "Producto";

  const [periodo,  setPeriodo]  = useState("mes");
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [tabActiva, setTabActiva] = useState("linea");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${id}/ventas?periodo=${periodo}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData({
          detalle:     Array.isArray(d.detalle)     ? d.detalle     : [],
          serie:       Array.isArray(d.serie)       ? d.serie       : [],
          porVariante: Array.isArray(d.porVariante) ? d.porVariante : [],
        });
        setLoading(false);
      })
      .catch((err) => { setError(`Error al cargar las ventas. (${err.message})`); setLoading(false); });
  }, [id, periodo]);

  const totalVendido  = data?.serie?.reduce((s, r) => s + Number(r.total_vendido), 0) ?? 0;
  const diasConVentas = data?.serie?.length ?? 0;
  const promDiario    = diasConVentas ? (totalVendido / diasConVentas).toFixed(1) : 0;
  const varianteTop   = data?.porVariante?.[0];

  const formatFecha = (f) => {
    if (!f) return "";
    const d = new Date(f);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="vp-page">
      <div className="vp-back">
        <button className="vp-back__btn" onClick={() => navigate(-1)}>
          ← Volver
        </button>
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

      {loading && (
        <div className="vp-state">
          <span className="vp-spinner" /> Cargando ventas…
        </div>
      )}

      {!loading && error && (
        <div className="vp-state vp-state--error">⚠️ {error}</div>
      )}

      {!loading && data && (
        <>
          {/* ── 1. TABLA DE DETALLE (arriba) ── */}
<div className="vp-table-section">
  <h2 className="vp-section-title">Detalle de ventas</h2>
  <div className="vp-table-wrap">
    <table className="vp-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Producto</th>       {/* ← nueva columna */}
          <th>Color</th>
          <th>Atributos</th>
          <th>Cantidad vendida</th>
        </tr>
      </thead>
      <tbody>
        {data.detalle.map((row, i) => (
          <tr key={i} className="vp-tr">
            <td className="vp-td vp-td--fecha">
              {new Date(row.fecha).toLocaleDateString("es-MX", {
                day: "2-digit", month: "short", year: "numeric"
              })}
            </td>
            <td className="vp-td">
              {row.producto}      {/* ← mostrar nombre del producto */}
            </td>
            <td className="vp-td">
              <span className="vp-color-dot" />
              {row.color}
            </td>
            <td className="vp-td vp-td--desc">
              {row.atributos
                ? row.atributos.split(", ").map((a, j) => (
                    <span key={j} className="vp-attr">{a}</span>
                  ))
                : <span className="vp-muted">—</span>
              }
            </td>
            <td className="vp-td vp-td--qty">
              <strong>{row.cantidad_vendida}</strong> uds.
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
          {/* ── 2. GRÁFICAS (medio) ── */}
          {data.serie.length > 0 ? (
            <div className="vp-charts">
              <div className="vp-charts__header">
                <h2 className="vp-section-title">Evolución de ventas</h2>
                <div className="vp-tabs">
                  {[
                    { key: "linea", label: "📈 Línea" },
                    { key: "barra", label: "📊 Barras" },
                    { key: "pie",   label: "🥧 Distribución" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`vp-tab${tabActiva === t.key ? " vp-tab--active" : ""}`}
                      onClick={() => setTabActiva(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="vp-chart-box">
                {tabActiva === "linea" && (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.serie} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                      <XAxis dataKey="fecha" tickFormatter={formatFecha} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total_vendido"
                        name="Unidades vendidas"
                        stroke="#4f7cff"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#4f7cff" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {tabActiva === "barra" && (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.serie} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                      <XAxis dataKey="fecha" tickFormatter={formatFecha} stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_vendido" name="Unidades vendidas" fill="#4f7cff" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {tabActiva === "pie" && (
                  <div className="vp-pie-wrap">
                    <ResponsiveContainer width="55%" height={260}>
                      <PieChart>
                        <Pie
                          data={data.porVariante}
                          dataKey="total_vendido"
                          nameKey="color"
                          cx="50%" cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={3}
                        >
                          {data.porVariante.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [`${v} uds.`, n]}
                          contentStyle={{ background: "#1f2438", border: "1px solid #2a2f4a", borderRadius: 8, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="vp-pie-legend">
                      {data.porVariante.map((v, i) => (
                        <div key={v.variante_id} className="vp-pie-legend__item">
                          <span className="vp-pie-legend__dot" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="vp-pie-legend__color">{v.color}</span>
                          <span className="vp-pie-legend__desc">{v.descripcion}</span>
                          <span className="vp-pie-legend__val">{v.total_vendido} uds.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="vp-state vp-state--empty">
              <span>📭</span>
              <p>No hay ventas registradas en este período.</p>
            </div>
          )}

          {/* ── 3. KPIs (abajo) ── */}
          <div className="vp-kpis">
            <KpiCard label="Unidades vendidas"  value={totalVendido}  color="#4f7cff" />
            <KpiCard label="Días con ventas"    value={diasConVentas} color="#22c55e" />
            <KpiCard label="Promedio diario"    value={promDiario}    sub="unidades/día" color="#f59e0b" />
            <KpiCard
              label="Variante más vendida"
              value={varianteTop ? `${varianteTop.total_vendido} uds.` : "—"}
              sub={varianteTop ? `${varianteTop.color}` : ""}
              color="#9b59f7"
            />
          </div>
        </>
      )}
    </div>
  );
}