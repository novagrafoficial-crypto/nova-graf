// src/pages/client/OfertasPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ofertaService } from "../../services/ofertaService";
import "../../styles/client/OfertasPage.css";

function OfertasPage() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      setError(null);
      const respuesta = await ofertaService.getOfertas();
      setOfertas(respuesta.data || []);
    } finally {
      setLoading(false);
    }
  };

  const getDescuentoTexto = (oferta) => {
    if (oferta.tipo === "porcentaje") {
      return `${oferta.valor}% OFF`;
    } else if (oferta.tipo === "fijo") {
      return `-$${oferta.valor.toFixed(2)}`;
    }
    return "";
  };

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
    });

  if (loading) {
    return (
      <div className="ofertas-wrapper">
        <div className="ofertas-loading">Cargando ofertas especiales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ofertas-wrapper">
        <div className="ofertas-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ofertas-wrapper">
      {/* ─── HEADER ─── */}
      <div className="ofertas-header">
        <h2>Ofertas y promociones</h2>
        <p>No dejes pasar estas ofertas exclusivas</p>
      </div>

      {ofertas.length === 0 ? (
        <div className="ofertas-empty">
          <span>🏷️</span>
          <p>No hay ofertas disponibles en este momento.</p>
          <Link to="/cliente/catalogo" className="ofertas-empty__link">
            Ver catálogo completo →
          </Link>
        </div>
      ) : (
        ofertas.map((oferta) => (
          <div key={oferta.id} className="oferta-seccion">
            {/* ─── CABECERA DE OFERTA ─── */}
            <div className="oferta-seccion__head">
              <div>
                <h3 className="oferta-seccion__nombre">{oferta.nombre}</h3>
                <p className="oferta-seccion__meta">
                  {oferta.cantidad_minima > 1 && 
                    `Mín. ${oferta.cantidad_minima} unidades · `
                  }
                  Hasta el {formatFecha(oferta.fecha_fin)}
                </p>
              </div>
              <span className="oferta-seccion__badge">
                {getDescuentoTexto(oferta)}
              </span>
            </div>

            {/* ─── GRID DE PRODUCTOS ─── */}
            <div className="ofertas-grid">
              {oferta.variantes.map((v) => (
                <Link
                  key={v.variante_id}
                  to={`/cliente/producto/${v.producto_id}`}
                  className="oferta-card"
                >
                  <div className="oferta-card__imagen">
                    <img
                      src={v.imagen}
                      alt={v.producto_nombre}
                      onError={(e) => {
                        e.target.src = "/default-product.jpg";
                      }}
                      loading="lazy"
                    />
                    <span className="oferta-card__badge">
                      {getDescuentoTexto(oferta)}
                    </span>
                  </div>

                  <div className="oferta-card__info">
                    <h4 className="oferta-card__nombre">{v.producto_nombre}</h4>

                    {v.color && v.color !== "Standard" && (
                      <p className="oferta-card__color">{v.color}</p>
                    )}

                    <div className="oferta-card__precios">
                      <span className="oferta-card__precio-final">
                        ${v.precio_final.toFixed(2)}
                      </span>
                      <span className="oferta-card__precio-original">
                        ${v.precio_original.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default OfertasPage;