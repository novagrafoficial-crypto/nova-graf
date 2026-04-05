import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import "../../styles/Admin/VentasGrafica.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PERIODOS = [
  { key: "dia",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "30 días" },
  { key: "todo",   label: "Todo" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="vg-tooltip">
      <p className="vg-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function VentasGrafica() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const productoNombre = location.state?.producto_nombre ?? "Producto";
  const queryParams = new URLSearchParams(location.search);
  const initialPeriodo = queryParams.get("periodo") || "mes";

  const [periodo, setPeriodo] = useState(initialPeriodo);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
          serie: Array.isArray(d.serie) ? d.serie : [],
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(`Error al cargar los datos. (${err.message})`);
        setLoading(false);
      });
  }, [id, periodo]);

  const formatFecha = (f) => {
    if (!f) return "";
    const d = new Date(f);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const handlePeriodoChange = (newPeriodo) => {
    setPeriodo(newPeriodo);
    navigate(`/admin/ventas/${id}/grafica?periodo=${newPeriodo}`, {
      state: { producto_nombre: productoNombre },
      replace: true,
    });
  };

  return (
    <div className="vg-page">
      <div className="vg-back">
        <button className="vg-back__btn" onClick={() => navigate(-1)}>
          ← Volver a ventas
        </button>
        <span className="vg-back__sep">/</span>
        <span className="vg-back__txt">{productoNombre}</span>
        <span className="vg-back__sep">/</span>
        <span className="vg-back__current">Gráfica de ventas</span>
      </div>

      <header className="vg-header">
        <h1 className="vg-title">Gráfica de ventas - {productoNombre}</h1>
        <div className="vg-periodos">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              className={`vg-periodo-btn${periodo === p.key ? " vg-periodo-btn--active" : ""}`}
              onClick={() => handlePeriodoChange(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      {loading && (
        <div className="vg-state">
          <span className="vg-spinner" /> Cargando datos…
        </div>
      )}

      {!loading && error && (
        <div className="vg-state vg-state--error">⚠️ {error}</div>
      )}

      {!loading && data && (
        <>
          {data.serie.length > 0 ? (
            <div className="vg-charts">
              <div className="vg-charts__header">
                <div className="vg-tabs">
                  <button
                    className={`vg-tab${tabActiva === "linea" ? " vg-tab--active" : ""}`}
                    onClick={() => setTabActiva("linea")}
                  >
                    📈 Línea
                  </button>
                  <button
                    className={`vg-tab${tabActiva === "barra" ? " vg-tab--active" : ""}`}
                    onClick={() => setTabActiva("barra")}
                  >
                    📊 Barras
                  </button>
                </div>
              </div>
              <div className="vg-chart-box">
                {tabActiva === "linea" && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data.serie} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                      <XAxis 
                        dataKey="fecha" 
                        tickFormatter={formatFecha} 
                        stroke="#64748b" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total_vendido"
                        name="Unidades vendidas"
                        stroke="#4f7cff"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#4f7cff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {tabActiva === "barra" && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.serie} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
                      <XAxis 
                        dataKey="fecha" 
                        tickFormatter={formatFecha} 
                        stroke="#64748b" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total_vendido" name="Unidades vendidas" fill="#4f7cff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ) : (
            <div className="vg-state vg-state--empty">
              <span>📭</span>
              <p>No hay datos de ventas para el período seleccionado.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}