import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/admin/Variantesmodal.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const POR_PAGINA = 10;

function VarianteRow({ v, index }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <tr className="vv-row" style={{ animationDelay: `${index * 35}ms` }}>
      {/* Imagen */}
      <td className="vv-td vv-td--img">
        {!imgErr && v.imagen_url ? (
          <img src={v.imagen_url} alt={v.color} className="vv-thumb" onError={() => setImgErr(true)} />
        ) : (
          <div className="vv-thumb vv-thumb--empty">📦</div>
        )}
      </td>

      {/* Nombre del producto */}
      <td className="vv-td">
        <span style={{ fontWeight: 600, color: 'var(--vv-text)' }}>{v.producto}</span>
      </td>

      {/* Color */}
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

      {/* Atributos / Descripción */}
      <td className="vv-td vv-td--attrs">
        {v.descripcion
          ? v.descripcion.split(", ").map((a, i) => <span key={i} className="vv-attr">{a}</span>)
          : <span className="vv-muted">—</span>}
      </td>

      {/* Stock: solo número + "uds." */}
      <td className="vv-td vv-td--stock">
        <span className="vv-stock-number">{v.cantidad_disponible} uds.</span>
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
  const [pagina,    setPagina]    = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/admin/reabastecimiento/productos/${id}/variantes`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setVariantes(d); setLoading(false); })
      .catch((e) => { setError(`Error al cargar las variantes. (${e.message})`); setLoading(false); });
  }, [id]);

  useEffect(() => { setPagina(1); }, [id]);

  const totalPaginas  = Math.ceil(variantes.length / POR_PAGINA);
  const inicio        = (pagina - 1) * POR_PAGINA;
  const variantesPag  = variantes.slice(inicio, inicio + POR_PAGINA);

  const totalStock = variantes.reduce((s, v) => s + Number(v.cantidad_disponible), 0);
  const sinStock   = variantes.filter((v) => Number(v.cantidad_disponible) === 0).length;
  const stockBajo  = variantes.filter(
    (v) => Number(v.cantidad_disponible) > 0 && Number(v.cantidad_disponible) <= Number(v.cantidad_minima)
  ).length;
  const enStock = variantes.length - sinStock - stockBajo;

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

      <header className="vv-header">
        <div>
          <h1 className="vv-title">{productoNombre}</h1>
          <p className="vv-subtitle">Stock disponible por variante</p>
        </div>
      </header>

      {/* KPIs simplificados (opcional) */}
      {!loading && !error && variantes.length > 0 && (
        <div className="vv-kpis">
          <div className="vv-kpi vv-kpi--blue">
            <span className="vv-kpi__num">{variantes.length}</span>
            <span className="vv-kpi__label">Variantes</span>
          </div>
          <div className="vv-kpi vv-kpi--green">
            <span className="vv-kpi__num">{totalStock}</span>
            <span className="vv-kpi__label">Stock total</span>
          </div>
        </div>
      )}

      {loading && <div className="vv-state"><span className="vv-spinner" />Cargando variantes…</div>}
      {!loading && error && <div className="vv-state vv-state--error">⚠️ {error}</div>}
      {!loading && !error && variantes.length === 0 && (
        <div className="vv-state vv-state--empty"><span>📭</span><p>No hay variantes registradas.</p></div>
      )}

      {!loading && !error && variantes.length > 0 && (
        <>
          <div className="vv-table-wrap">
            <table className="vv-table">
              <thead>
                <tr>
                  <th></th>
                  <th>PRODUCTOS</th>
                  <th>COLOR</th>
                  <th>CARACTERÍSTICAS DE PRODUCTO</th>
                  <th>CANTIDAD DISPONIBLE POR VARIANTE</th>
                </tr>
              </thead>
              <tbody>
                {variantesPag.map((v, i) => (
                  <VarianteRow key={v.variante_id} v={v} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="vv-pagination">
              <span className="vv-pagination__info">
                {inicio + 1}–{Math.min(inicio + POR_PAGINA, variantes.length)} de {variantes.length} variantes
              </span>
              <div className="vv-pagination__controls">
                <button
                  className="vv-pagination__btn"
                  onClick={() => setPagina(p => p - 1)}
                  disabled={pagina === 1}
                >
                  ← Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`vv-pagination__btn vv-pagination__btn--num ${n === pagina ? 'vv-pagination__btn--active' : ''}`}
                    onClick={() => setPagina(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="vv-pagination__btn"
                  onClick={() => setPagina(p => p + 1)}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}