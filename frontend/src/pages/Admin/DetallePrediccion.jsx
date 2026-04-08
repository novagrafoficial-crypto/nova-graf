import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine
} from "recharts";
import "../../styles/Admin/DetallePrediccion.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

export default function DetallePrediccion() {
  const { varianteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const varianteData = location.state?.variante;

  const [variante, setVariante] = useState(varianteData || null);
  const [loading, setLoading] = useState(!varianteData);
  const [error, setError] = useState(null);
  const [tipoGrafica, setTipoGrafica] = useState("linea");
  const [datosProyeccion, setDatosProyeccion] = useState([]);

  useEffect(() => {
    if (varianteData) {
      generarProyeccion(varianteData);
      return;
    }
    setLoading(true);
    fetch(`${API}/api/admin/reabastecimiento/prediccion`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const encontrada = data.find(v => v.variante_id == varianteId);
        if (!encontrada) throw new Error("Variante no encontrada");
        setVariante(encontrada);
        generarProyeccion(encontrada);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [varianteId, varianteData]);

  const generarProyeccion = (v) => {
    const { stock_actual, rop, k, promedio_diario } = v;
    const dias = [];
    if (k !== null && k < 0) {
      let t = 0;
      let stock = stock_actual;
      while (stock > rop && t <= 365) {
        dias.push({ dia: t, stock: Math.max(0, Math.round(stock)), ropLine: rop });
        t++;
        stock = stock_actual * Math.exp(k * t);
        if (stock <= 0) break;
      }
      if (stock <= rop) {
        dias.push({ dia: t, stock: Math.max(0, Math.round(stock)), ropLine: rop });
      }
    } else {
      let t = 0;
      let stock = stock_actual;
      while (stock > rop && t <= 365) {
        dias.push({ dia: t, stock: Math.max(0, Math.round(stock)), ropLine: rop });
        t++;
        stock = stock_actual - (promedio_diario * t);
        if (stock <= 0) break;
      }
      if (stock <= rop) {
        dias.push({ dia: t, stock: Math.max(0, Math.round(stock)), ropLine: rop });
      }
    }
    setDatosProyeccion(dias);
  };

  const calcularSugerencia = () => {
    if (!variante) return 0;
    const { promedio_diario, rop, estado } = variante;
    if (estado === "critico") {
      return Math.max(rop * 2, Math.ceil(promedio_diario * 14));
    } else if (estado === "proximo") {
      return Math.max(rop, Math.ceil(promedio_diario * 7));
    } else {
      return Math.ceil(promedio_diario * 30);
    }
  };

  if (loading) return <div className="vpd-page"><div className="vpd-state">Cargando predicción...</div></div>;
  if (error) return <div className="vpd-page"><div className="vpd-state vpd-state--error">⚠️ {error}</div></div>;
  if (!variante) return <div className="vpd-page"><div className="vpd-state">No se encontró la variante.</div></div>;

  const sugerencia = calcularSugerencia();

  return (
    <div className="vpd-page">
      <div className="vpd-breadcrumb">
        <button className="vpd-back" onClick={() => navigate(-1)}>← Volver</button>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb">{variante.producto_nombre}</span>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb">{variante.color}</span>
        <span className="vpd-sep">/</span>
        <span className="vpd-crumb vpd-crumb--active">Predicción detallada</span>
      </div>

      <header className="vpd-header">
        <h1 className="vpd-title">{variante.producto_nombre} - {variante.color}</h1>
        <p className="vpd-subtitle">Proyección de inventario hasta el punto de reorden</p>
      </header>

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

      <div className="vpd-graph-controls">
        <div className="vpd-tabs">
          <button className={`vpd-tab${tipoGrafica === "linea" ? " vpd-tab--active" : ""}`} onClick={() => setTipoGrafica("linea")}>📈 Línea</button>
          <button className={`vpd-tab${tipoGrafica === "barra" ? " vpd-tab--active" : ""}`} onClick={() => setTipoGrafica("barra")}>📊 Barras</button>
        </div>
      </div>

      <div className="vpd-chart-container">
        <h3 className="vpd-chart-title">Proyección de stock hasta el punto de reorden (ROP)</h3>
        <p className="vpd-chart-desc">La línea roja horizontal marca el ROP. Cuando el stock cruce ese nivel, será momento de reabastecer.</p>
        <ResponsiveContainer width="100%" height={400}>
          {tipoGrafica === "linea" ? (
            <LineChart data={datosProyeccion} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
              <XAxis dataKey="dia" label={{ value: "Días", position: "insideBottom", offset: -5 }} stroke="#64748b" />
              <YAxis label={{ value: "Unidades en stock", angle: -90, position: "insideLeft" }} stroke="#64748b" />
              <Tooltip formatter={(value) => `${value} uds.`} labelFormatter={(label) => `Día ${label}`} />
              <ReferenceLine y={variante.rop} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "ROP", position: "right", fill: "#ef4444" }} />
              <Line type="monotone" dataKey="stock" stroke="#4f7cff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Stock proyectado" />
            </LineChart>
          ) : (
            <BarChart data={datosProyeccion} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
              <XAxis dataKey="dia" label={{ value: "Días", position: "insideBottom", offset: -5 }} stroke="#64748b" />
              <YAxis label={{ value: "Unidades en stock", angle: -90, position: "insideLeft" }} stroke="#64748b" />
              <Tooltip formatter={(value) => `${value} uds.`} labelFormatter={(label) => `Día ${label}`} />
              <ReferenceLine y={variante.rop} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "ROP", position: "right", fill: "#ef4444" }} />
              <Bar dataKey="stock" fill="#4f7cff" name="Stock proyectado" />
            </BarChart>
          )}
        </ResponsiveContainer>
        <div className="vpd-chart-footnote">
          * Proyección basada en el ritmo actual de ventas. El stock disminuye hasta alcanzar el punto de reorden (ROP).
        </div>
      </div>
    </div>
  );
}