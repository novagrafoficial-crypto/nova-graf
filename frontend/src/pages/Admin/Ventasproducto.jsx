// src/pages/admin/VentasProducto.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../../styles/Admin/VentasProducto.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PERIODOS = [
  { key: "dia",    label: "Hoy" },
  { key: "semana", label: "7 días" },
  { key: "mes",    label: "30 días" },
  { key: "todo",   label: "Todo" },
];

// Componente para cada fila de la tabla (maneja error de imagen)
function FilaVenta({ row, index }) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="vp-tr" style={{ animationDelay: `${index * 35}ms` }}>
      <td className="vp-td vp-td--fecha">
        {new Date(row.fecha).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="vp-td vp-td--img">
        {!imgError && row.imagen_url ? (
          <img
            src={row.imagen_url}
            alt={row.producto}
            className="vp-thumb"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="vp-thumb vp-thumb--empty">📷</div>
        )}
      </td>
      <td className="vp-td">{row.producto}</td>
      <td className="vp-td">
        <span className="vp-color-dot" style={{ backgroundColor: row.color_hex || "#4f7cff" }} />
        {row.color}
      </td>
      <td className="vp-td vp-td--desc">
        {row.atributos ? (
          row.atributos.split(", ").map((a, j) => (
            <span key={j} className="vp-attr">{a}</span>
          ))
        ) : (
          <span className="vp-muted">—</span>
        )}
      </td>
      <td className="vp-td vp-td--qty">
        <strong>{row.cantidad_vendida}</strong> uds.
      </td>
    </tr>
  );
}

export default function VentasProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const productoNombre = location.state?.producto_nombre ?? "Producto";

  const [periodo, setPeriodo] = useState("mes");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

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
          detalle: Array.isArray(d.detalle) ? d.detalle : [],
          serie: Array.isArray(d.serie) ? d.serie : [],
        });
        setLoading(false);
        setPaginaActual(1);
      })
      .catch((err) => {
        setError(`Error al cargar las ventas. (${err.message})`);
        setLoading(false);
      });
  }, [id, periodo]);

  const totalFilas = data?.detalle.length ?? 0;
  const totalPaginas = Math.ceil(totalFilas / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const filasPagina = data?.detalle.slice(inicio, inicio + itemsPorPagina) ?? [];

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const handleVerGrafica = () => {
    navigate(`/admin/ventas/${id}/grafica?periodo=${periodo}`, {
      state: { producto_nombre: productoNombre }
    });
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
          {/* Botón para ir a la gráfica */}
          {data.serie.length > 0 && (
            <div className="vp-toggle-graph">
              <button className="vp-toggle-graph__btn" onClick={handleVerGrafica}>
                📊 Ver gráfica de ventas
              </button>
            </div>
          )}

          {/* TABLA DE DETALLE CON PAGINACIÓN */}
          <div className="vp-table-section">
            <h2 className="vp-section-title">📋 Detalle de ventas</h2>
            <div className="vp-table-wrap">
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>IMAGEN</th>
                    <th>PRODUCTO</th>
                    <th>COLOR</th>
                    <th>DESCRIPCIÓN DE PRODUCTO</th>
                    <th>CANTIDAD VENDIDA</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPagina.map((row, i) => (
                    <FilaVenta key={i} row={row} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            {totalPaginas > 1 && (
              <div className="vp-pagination">
                <button
                  className="vp-pagination__btn"
                  disabled={paginaActual === 1}
                  onClick={() => cambiarPagina(paginaActual - 1)}
                >
                  ← Anterior
                </button>
                <span className="vp-pagination__info">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  className="vp-pagination__btn"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => cambiarPagina(paginaActual + 1)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>

          {data.serie.length === 0 && (
            <div className="vp-state vp-state--empty">
              <span>📭</span>
              <p>No hay ventas registradas en este período.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}