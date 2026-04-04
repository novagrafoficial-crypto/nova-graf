// src/pages/Admin/VariantesProducto.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/Admin/Variantesmodal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StockChip({ cantidad, minima }) {
  if (Number(cantidad) === 0)
    return <span className="vv-chip vv-chip--danger">Sin stock</span>;
  if (Number(cantidad) <= Number(minima))
    return <span className="vv-chip vv-chip--warn">Stock bajo · {cantidad}</span>;
  return <span className="vv-chip vv-chip--ok">En stock · {cantidad}</span>;
}

function StockBar({ cantidad, minima }) {
  const pct =
    Number(minima) > 0
      ? Math.min(100, Math.round((Number(cantidad) / Number(minima)) * 100))
      : 100;
  const color =
    Number(cantidad) === 0 ? "#ef4444"
    : Number(cantidad) <= Number(minima) ? "#f59e0b"
    : "#22c55e";
  return (
    <div className="vv-bar-wrap">
      <div className="vv-bar" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function VarianteRow({ v, index }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <tr className="vv-row" style={{ animationDelay: `${index * 35}ms` }}>
      <td className="vv-td vv-td--img">
        {!imgErr && v.imagen_url ? (
          <img src={v.imagen_url} alt={v.color} className="vv-thumb" onError={() => setImgErr(true)} />
        ) : (
          <div className="vv-thumb vv-thumb--empty">📦</div>
        )}
      </td>
      <td className="vv-td"><span className="vv-id">#{v.variante_id}</span></td>
      <td className="vv-td">
        <div className="vv-color">
          <span className="vv-color__dot" style={{
            background: v.color?.toLowerCase() === "multicolor"
              ? "linear-gradient(135deg,#f00,#0f0,#00f)"
              : v.color?.toLowerCase(),
          }} />
          {v.color}
        </div>
      </td>
      <td className="vv-td vv-td--attrs">
        {v.descripcion
          ? v.descripcion.split(", ").map((a, i) => <span key={i} className="vv-attr">{a}</span>)
          : <span className="vv-muted">—</span>}
      </td>
      <td className="vv-td vv-td--stock">
        <StockChip cantidad={v.cantidad_disponible} minima={v.cantidad_minima} />
        <StockBar  cantidad={v.cantidad_disponible} minima={v.cantidad_minima} />
        <span className="vv-stock-label">{v.cantidad_disponible} / mín {v.cantidad_minima}</span>
      </td>
    </tr>
  );
}

export default function VariantesProducto() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const productoNombre = location.state?.producto_nombre ?? "Producto";
  const categoria      = location.state?.categoria       ?? "";
  const subcategoria   = location.state?.subcategoria    ?? "";

  const [variantes, setVariantes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${id}/variantes`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setVariantes(d); setLoading(false); })
      .catch((e) => { setError(`Error al cargar las variantes. (${e.message})`); setLoading(false); });
  }, [id]);

  const totalStock = variantes.reduce((s, v) => s + Number(v.cantidad_disponible), 0);
  const sinStock   = variantes.filter((v) => Number(v.cantidad_disponible) === 0).length;
  const stockBajo  = variantes.filter(
    (v) => Number(v.cantidad_disponible) > 0 && Number(v.cantidad_disponible) <= Number(v.cantidad_minima)
  ).length;
  const enStock    = variantes.length - sinStock - stockBajo;

  return (
    <div className="vv-page">

      {/* Breadcrumb */}
      <div className="vv-breadcrumb">
        <button className="vv-back" onClick={() => navigate(-1)}>← Volver</button>
        <span className="vv-sep">/</span>
        {categoria    && <><span className="vv-crumb vv-crumb--muted">{categoria}</span><span className="vv-sep">/</span></>}
        {subcategoria && <><span className="vv-crumb vv-crumb--muted">{subcategoria}</span><span className="vv-sep">/</span></>}
        <span className="vv-crumb">{productoNombre}</span>
        <span className="vv-sep">/</span>
        <span className="vv-crumb vv-crumb--active">Variantes</span>
      </div>

      {/* Header */}
      <header className="vv-header">
        <div>
          <h1 className="vv-title">{productoNombre}</h1>
          <p className="vv-subtitle">Stock disponible por variante</p>
        </div>
      </header>

      {/* KPIs */}
      {!loading && !error && variantes.length > 0 && (
        <div className="vv-kpis">
          <div className="vv-kpi vv-kpi--blue">
            <span className="vv-kpi__num">{variantes.length}</span>
            <span className="vv-kpi__label">Variantes</span>
          </div>
          <div className="vv-kpi vv-kpi--green">
            <span className="vv-kpi__num">{totalStock}</span>
            <span className="vv-kpi__label">Unidades totales</span>
          </div>
          <div className="vv-kpi vv-kpi--green2">
            <span className="vv-kpi__num">{enStock}</span>
            <span className="vv-kpi__label">En stock</span>
          </div>
          {stockBajo > 0 && (
            <div className="vv-kpi vv-kpi--warn">
              <span className="vv-kpi__num">{stockBajo}</span>
              <span className="vv-kpi__label">Stock bajo</span>
            </div>
          )}
          {sinStock > 0 && (
            <div className="vv-kpi vv-kpi--danger">
              <span className="vv-kpi__num">{sinStock}</span>
              <span className="vv-kpi__label">Sin stock</span>
            </div>
          )}
        </div>
      )}

      {/* Estados */}
      {loading && <div className="vv-state"><span className="vv-spinner" />Cargando variantes…</div>}
      {!loading && error && <div className="vv-state vv-state--error">⚠️ {error}</div>}
      {!loading && !error && variantes.length === 0 && (
        <div className="vv-state vv-state--empty"><span>📭</span><p>No hay variantes registradas.</p></div>
      )}

      {/* Tabla */}
      {!loading && !error && variantes.length > 0 && (
        <div className="vv-table-wrap">
          <table className="vv-table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Color</th>
                <th>Atributos</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {variantes.map((v, i) => (
                <VarianteRow key={v.variante_id} v={v} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}