import { useState, useEffect } from "react";
import "../../styles/Admin/PrediccionModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function PrediccionModal({ producto, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [leadTime, setLeadTime] = useState(7); // días de entrega, editable
  const [periodo, setPeriodo] = useState("mes");

  // Calcular indicadores en función del leadTime
  const calcular = (base, lead) => {
    if (!base) return null;
    const promedio = base.ventas_promedio_diarias;
    const maxDiario = base.demanda_maxima_diaria;
    const stock = base.stock_actual;

    // Stock de seguridad = (demanda_max - promedio) * lead_time
    const stockSeguridad = Math.max(0, (maxDiario - promedio) * lead);
    // Punto de reorden = (promedio * lead) + stockSeguridad
    const puntoReorden = (promedio * lead) + stockSeguridad;
    // Días para agotarse = stock / promedio (si promedio > 0)
    const diasAgotamiento = promedio > 0 ? stock / promedio : Infinity;
    // Cantidad sugerida de pedido = (promedio * lead) * 2  (para cubrir 2 ciclos)
    const cantidadPedido = Math.ceil((promedio * lead) * 2);

    return {
      stockSeguridad: Math.ceil(stockSeguridad),
      puntoReorden: Math.ceil(puntoReorden),
      diasAgotamiento: diasAgotamiento === Infinity ? "∞" : diasAgotamiento.toFixed(1),
      cantidadPedido,
    };
  };

  const indicadores = data ? calcular(data, leadTime) : null;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${producto.producto_id}/prediccion?periodo=${periodo}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [producto.producto_id, periodo]);

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="pm-overlay" onClick={onClose} onKeyDown={handleKey} tabIndex={-1}>
      <div className="pm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <h2 className="pm-title">🔮 Predicción de Reabastecimiento</h2>
          <button className="pm-close" onClick={onClose}>✕</button>
        </div>

        <div className="pm-body">
          {loading && (
            <div className="pm-state">
              <span className="pm-spinner" /> Cargando datos...
            </div>
          )}
          {!loading && error && (
            <div className="pm-state pm-state--error">⚠️ {error}</div>
          )}
          {!loading && data && (
            <>
              <div className="pm-producto">
                <h3>{producto.producto_nombre}</h3>
                <p className="pm-marca">{producto.marca}</p>
              </div>

              <div className="pm-filters">
                <label>Período de análisis:</label>
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                  <option value="dia">Último día</option>
                  <option value="semana">Últimos 7 días</option>
                  <option value="mes">Últimos 30 días</option>
                  <option value="todo">Todo el historial</option>
                </select>
              </div>

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
                  <span className="pm-stat-label">Promedio diario</span>
                  <span className="pm-stat-value">{data.ventas_promedio_diarias} uds/día</span>
                </div>
                <div className="pm-stat-card">
                  <span className="pm-stat-label">Demanda máxima diaria</span>
                  <span className="pm-stat-value">{data.demanda_maxima_diaria} uds.</span>
                </div>
              </div>

              <div className="pm-param">
                <label>Tiempo de entrega del proveedor (días):</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={leadTime}
                  onChange={(e) => setLeadTime(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

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
                    <span className="pm-result-value">{indicadores.diasAgotamiento} días</span>
                    <span className="pm-result-desc">Con el ritmo de ventas actual</span>
                  </div>
                  <div className="pm-result-card">
                    <span className="pm-result-label">🛒 Cantidad sugerida de pedido</span>
                    <span className="pm-result-value">{indicadores.cantidadPedido} uds.</span>
                    <span className="pm-result-desc">Para cubrir 2 ciclos de entrega</span>
                  </div>
                </div>
              )}

              <div className="pm-note">
                <small>📐 Fórmulas: Stock seguridad = (demanda_max - promedio) × lead_time | Punto de reorden = (promedio × lead_time) + stock_seguridad</small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrediccionModal;