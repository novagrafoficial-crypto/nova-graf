import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine
} from "recharts";
import "../../styles/admin/DetallePrediccion.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtDias = (dias) => {
  if (dias === null || dias === undefined) return "—";
  if (!isFinite(dias) || dias > 9999) return "∞";
  if (dias < 0) return "Ya superó ROP";
  return `${Math.ceil(dias)} días`;
};

const badgeEstado = (estado) => {
  const map = {
    critico:    { label: "Crítico",    cls: "badge--critico" },
    proximo:    { label: "Próximo",    cls: "badge--proximo" },
    abastecido: { label: "Abastecido", cls: "badge--abastecido" },
  };
  const b = map[estado] ?? { label: estado, cls: "" };
  return <span className={`vpd-badge ${b.cls}`}>{b.label}</span>;
};

// ─── SUGERENCIA DE REABASTECIMIENTO ──────────────────────────────────────────
const calcularSugerencia = (variante) => {
  if (!variante) return 0;
  const { promedio_diario, rop, estado } = variante;
  if (estado === "critico")  return Math.max(rop * 2, Math.ceil(promedio_diario * 14));
  if (estado === "proximo")  return Math.max(rop,     Math.ceil(promedio_diario * 7));
  return Math.ceil(promedio_diario * 30);
};

// ─── GENERADOR DE PROYECCIÓN ──────────────────────────────────────────────────
const generarProyeccion = (v) => {
  const { stock_actual: x0, rop, k, promedio_diario: d } = v;
  const puntos = [];

  if (k !== null && k < 0) {
    for (let t = 0; t <= 365; t++) {
      const stock = Math.max(0, Math.round(x0 * Math.exp(k * t)));
      puntos.push({ dia: t, stock, ropLine: rop });
      if (stock <= rop) break;
    }
  } else if (d > 0) {
    for (let t = 0; t <= 365; t++) {
      const stock = Math.max(0, Math.round(x0 - d * t));
      puntos.push({ dia: t, stock, ropLine: rop });
      if (stock <= rop) break;
    }
  }

  return puntos;
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function DetallePrediccion() {
  const { varianteId } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const varianteData   = location.state?.variante;

  const [variante,        setVariante]        = useState(varianteData || null);
  const [loading,         setLoading]         = useState(!varianteData);
  const [error,           setError]           = useState(null);
  const [tipoGrafica,     setTipoGrafica]     = useState("linea");
  const [datosProyeccion, setDatosProyeccion] = useState([]);

  useEffect(() => {
    if (varianteData) {
      setDatosProyeccion(generarProyeccion(varianteData));
      return;
    }
    setLoading(true);
    fetch(`${API}/api/admin/reabastecimiento/prediccion`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const encontrada = data.find((v) => v.variante_id == varianteId);
        if (!encontrada) throw new Error("Variante no encontrada");
        setVariante(encontrada);
        setDatosProyeccion(generarProyeccion(encontrada));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [varianteId, varianteData]);

  if (loading) return <div className="vpd-page"><div className="vpd-state">Cargando predicción...</div></div>;
  if (error)   return <div className="vpd-page"><div className="vpd-state vpd-state--error">⚠️ {error}</div></div>;
  if (!variante) return <div className="vpd-page"><div className="vpd-state">No se encontró la variante.</div></div>;

  const sugerencia = calcularSugerencia(variante);

  return (
    <div className="vpd-page">

      {/* BREADCRUMB */}
      <div className="vpd-breadcrumb">
        <button className="vpd-back" onClick={() => navigate(-1)}>← Volver</button>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb">{variante.producto_nombre}</span>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb">{variante.color}</span>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb vpd-crumb--active">Predicción detallada</span>
      </div>

      {/* HEADER */}
      <header className="vpd-header">
        <h1 className="vpd-title">{variante.producto_nombre} — {variante.color}</h1>
        <p className="vpd-subtitle">Proyección de inventario hasta el punto de reorden</p>
      </header>

      {/* KPI CARDS */}
      <div className="vpd-card-grid">
        <div className="vpd-card">
          <div className="vpd-card__label">Stock actual</div>
          <div className="vpd-card__value">{variante.stock_actual} <span className="vpd-unit">uds.</span></div>
        </div>

        <div className="vpd-card">
          <div className="vpd-card__label">ROP (Mínimo)</div>
          <div className="vpd-card__value">{variante.rop} <span className="vpd-unit">uds.</span></div>
          <div className="vpd-card__help">Punto de reorden</div>
        </div>

        <div className="vpd-card">
          <div className="vpd-card__label">Promedio diario</div>
          <div className="vpd-card__value">
            {variante.promedio_diario?.toFixed(2)} <span className="vpd-unit">uds/día</span>
          </div>
          <div className="vpd-card__help">sobre 30 días calendario</div>
        </div>

        <div className="vpd-card">
          <div className="vpd-card__label">Tiempo restante</div>
          <div className="vpd-card__value">{fmtDias(variante.dias_hasta_rop)}</div>
          <div className="vpd-card__help">para alcanzar el ROP</div>
        </div>

        <div className="vpd-card">
          <div className="vpd-card__label">Sugerencia de reabastecimiento</div>
          <div className="vpd-card__value">{sugerencia} <span className="vpd-unit">uds.</span></div>
          <div className="vpd-card__help">cantidad recomendada para pedir</div>
        </div>

        <div className="vpd-card">
          <div className="vpd-card__label">Estado actual</div>
          <div className="vpd-card__value">{badgeEstado(variante.estado)}</div>
        </div>
      </div>

      {/* CONTROLES DE GRÁFICA */}
      <div className="vpd-graph-controls">
        <div className="vpd-tabs">
          <button
            className={`vpd-tab${tipoGrafica === "linea" ? " vpd-tab--active" : ""}`}
            onClick={() => setTipoGrafica("linea")}
          >📈 Línea</button>
          <button
            className={`vpd-tab${tipoGrafica === "barra" ? " vpd-tab--active" : ""}`}
            onClick={() => setTipoGrafica("barra")}
          >📊 Barras</button>
        </div>
      </div>

      {/* GRÁFICA */}
      <div className="vpd-chart-container">
        <h3 className="vpd-chart-title">
          Proyección de stock hasta el punto de reorden (ROP)
        </h3>
        <p className="vpd-chart-desc">
          La línea roja horizontal marca el ROP. Cuando el stock cruce ese nivel, es momento de reabastecer.
          La curva sigue el modelo <strong>x(t) = x₀ · e^(k·t)</strong>.
        </p>

        <ResponsiveContainer width="100%" height={400}>
          {tipoGrafica === "linea" ? (
            <LineChart data={datosProyeccion} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
              <XAxis
                dataKey="dia"
                label={{ value: "Días", position: "insideBottom", offset: -5 }}
                stroke="#1A6163"
              />
              <YAxis
                label={{ value: "Unidades en stock", angle: -90, position: "insideLeft" }}
                stroke="#64748b"
              />
              <Tooltip
                formatter={(v) => `${v} uds.`}
                labelFormatter={(l) => `Día ${l}`}
              />
              <ReferenceLine
                y={variante.rop}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: "ROP", position: "right", fill: "#ef4444" }}
              />
              <Line
                type="monotone"
                dataKey="stock"
                stroke="#1A6163"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Stock proyectado"
              />
            </LineChart>
          ) : (
            <BarChart data={datosProyeccion} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
              <XAxis
                dataKey="dia"
                label={{ value: "Días", position: "insideBottom", offset: -5 }}
                stroke="#1A6163"
              />
              <YAxis
                label={{ value: "Unidades en stock", angle: -90, position: "insideLeft" }}
                stroke="#1A6163"
              />
              <Tooltip
                formatter={(v) => `${v} uds.`}
                labelFormatter={(l) => `Día ${l}`}
              />
              <ReferenceLine
                y={variante.rop}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: "ROP", position: "right", fill: "#ef4444" }}
              />
              <Bar dataKey="stock" fill="#1A6163" name="Stock proyectado" />
            </BarChart>
          )}
        </ResponsiveContainer>

        <div className="vpd-chart-footnote">
          * Proyección basada en el modelo exponencial x(t) = x₀ · e^(k·t),
          donde d = ventas_totales / 30 días calendario y k = ln(1 − d/x₀).
        </div>
      </div>
    </div>
  );
}