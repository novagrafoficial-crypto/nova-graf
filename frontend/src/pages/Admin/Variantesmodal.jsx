// src/pages/admin/VariantesModal.jsx
import { useState, useEffect } from "react";
import "../../styles/Admin/VariantesModal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Fila de variante ─────────────────────────────────────────────────────────
function VarianteRow({ v, index }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <tr className="vm-row" style={{ animationDelay: `${index * 40}ms` }}>

      {/* Imagen */}
      <td className="vm-td vm-td--img">
        {!imgErr && v.imagen_url ? (
          <img
            src={v.imagen_url}
            alt={v.color}
            onError={() => setImgErr(true)}
            className="vm-thumb"
          />
        ) : (
          <div className="vm-thumb vm-thumb--fallback">📦</div>
        )}
      </td>

      {/* ID variante */}
      <td className="vm-td">
        <span className="vm-id">#{v.variante_id}</span>
      </td>

      {/* Color */}
      <td className="vm-td">
        <span className="vm-color-dot" style={{ background: v.color?.toLowerCase() === 'multicolor' ? 'linear-gradient(135deg,#f00,#0f0,#00f)' : v.color?.toLowerCase() }} />
        {v.color}
      </td>

      {/* Atributos */}
      <td className="vm-td vm-td--desc">
        {v.descripcion
          ? v.descripcion.split(', ').map((attr, i) => (
              <span key={i} className="vm-attr">{attr}</span>
            ))
          : <span className="vm-muted">—</span>
        }
      </td>

      {/* Stock disponible */}
      <td className="vm-td">{v.cantidad_disponible ?? 0}</td>

      {/* Stock mínimo */}
      <td className="vm-td">{v.cantidad_minima ?? 0}</td>
    </tr>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function VariantesModal({ producto, onClose }) {
  const [variantes, setVariantes] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    if (!producto) return;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/admin/reabastecimiento/productos/${producto.producto_id}/variantes`)
      .then((r) => r.json())
      .then((data) => { setVariantes(data); setLoading(false); })
      .catch(() => { setError("Error al cargar las variantes."); setLoading(false); });
  }, [producto]);

  if (!producto) return null;

  // ── Cerrar con Escape ──
  const handleKey = (e) => { if (e.key === "Escape") onClose(); };

  // ── Resumen rápido ──
  const totalStock  = variantes.reduce((s, v) => s + Number(v.cantidad_disponible), 0);
  const sinStock    = variantes.filter((v) => v.cantidad_disponible === 0).length;
  const stockBajo   = variantes.filter((v) => v.cantidad_disponible > 0 && v.cantidad_disponible <= v.cantidad_minima).length;

  return (
    <div className="vm-overlay" onClick={onClose} onKeyDown={handleKey} tabIndex={-1}>
      <div className="vm-panel" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="vm-header">
          <div className="vm-header__left">
            <p className="vm-header__cat">
              {producto.categoria}
              {producto.subcategoria && <> › {producto.subcategoria}</>}
            </p>
            <h2 className="vm-header__title">{producto.producto_nombre}</h2>
            {producto.marca && <p className="vm-header__marca">{producto.marca}</p>}
          </div>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Pills de resumen ── */}
        {!loading && !error && (
          <div className="vm-summary">
            <div className="vm-pill">
              <span className="vm-pill__num">{variantes.length}</span>
              <span className="vm-pill__label">variante{variantes.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="vm-pill">
              <span className="vm-pill__num">{totalStock}</span>
              <span className="vm-pill__label">unidades totales</span>
            </div>
            {sinStock > 0 && (
              <div className="vm-pill vm-pill--danger">
                <span className="vm-pill__num">{sinStock}</span>
                <span className="vm-pill__label">sin stock</span>
              </div>
            )}
            {stockBajo > 0 && (
              <div className="vm-pill vm-pill--warn">
                <span className="vm-pill__num">{stockBajo}</span>
                <span className="vm-pill__label">stock bajo</span>
              </div>
            )}
          </div>
        )}

        {/* ── Contenido ── */}
        <div className="vm-body">
          {loading && (
            <div className="vm-state">
              <span className="vm-spinner" />
              Cargando variantes…
            </div>
          )}

          {!loading && error && (
            <div className="vm-state vm-state--error">⚠️ {error}</div>
          )}

          {!loading && !error && variantes.length === 0 && (
            <div className="vm-state">📭 No hay variantes registradas.</div>
          )}

          {!loading && !error && variantes.length > 0 && (
            <div className="vm-table-wrap">
              <table className="vm-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Color</th>
                    <th>Atributos</th>
                    <th>Stock disponible</th>
                    <th>Stock mínimo</th>
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

      </div>
    </div>
  );
}