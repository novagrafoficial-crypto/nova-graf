import { useState, useEffect } from 'react';
import { getToken } from '../../utils/auth';
import '../../styles/client/SolicitudesDiseno.css';

const API_URL = import.meta.env.VITE_API_URL;

const ESTADOS = {
  pendiente_diseno:  { texto: 'Pendiente',        emoji: '⏳', clase: 'estado-pendiente'  },
  en_propuesta:      { texto: 'En diseño',        emoji: '🎨', clase: 'estado-en-proceso' },
  propuesta_enviada: { texto: 'Propuesta enviada', emoji: '📩', clase: 'estado-propuesta'  },
  aprobado:          { texto: 'Aprobado',         emoji: '✅', clase: 'estado-aprobado'   },
  rechazado:         { texto: 'Rechazado',        emoji: '❌', clase: 'estado-rechazado'  },
};

const SolicitudesDiseno = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [aprobando, setAprobando] = useState(null);

  const cargarSolicitudes = () => {
    const token = getToken();
    if (!token) {
      setError('No has iniciado sesión');
      setCargando(false);
      return;
    }

    fetch(`${API_URL}/api/client/solicitudes-diseno`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar solicitudes');
        return res.json();
      })
      .then(data => {
        setSolicitudes(data);
        setCargando(false);
      })
      .catch(err => {
        setError(err.message);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const aprobarPropuesta = async (solicitudId, propuestaId, costoDiseno, varianteId, precioBase) => {
    setAprobando(propuestaId);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/client/solicitudes-diseno/${solicitudId}/aprobar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          propuesta_id: propuestaId,
          costo_diseno: costoDiseno,
          variante_id: varianteId,
          precio_base_variante: precioBase,
        }),
      });
      if (!res.ok) throw new Error('No se pudo aprobar la propuesta');
      alert('✅ Propuesta aprobada. El producto fue agregado a tu carrito.');
      cargarSolicitudes();
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setAprobando(null);
    }
  };

  if (cargando) return <div className="sd-loading">Cargando solicitudes...</div>;
  if (error) return <div className="sd-error">❌ {error}</div>;

  if (solicitudes.length === 0) {
    return (
      <div className="sd-empty">
        <div className="sd-empty__icon">🎨</div>
        <p>Aún no has realizado ninguna solicitud de diseño personalizado.</p>
        <button className="sd-btn sd-btn--primary" onClick={() => window.history.back()}>
          Solicitar diseño
        </button>
      </div>
    );
  }

  return (
    <div className="sd-container">
      <h2 className="sd-titulo">Mis solicitudes de diseño</h2>

      <div className="sd-lista">
        {solicitudes.map(sol => {
          const estadoInfo = ESTADOS[sol.estado] || { texto: sol.estado, emoji: '•', clase: '' };
          const precioBaseNum = sol.variante ? parseFloat(sol.variante.precio_base) : 0;
          const costoDisenoNum = sol.costo_diseno ? parseFloat(sol.costo_diseno) : 0;
          const total = precioBaseNum + costoDisenoNum;

          return (
            <div key={sol.id} className="sd-card">
              {/* ENCABEZADO */}
              <div className="sd-card__header">
                <div className="sd-card__header-left">
                  <span className="sd-solicitud-id">Solicitud #{sol.id}</span>
                  <span className={`sd-estado ${estadoInfo.clase}`}>
                    {estadoInfo.emoji} {estadoInfo.texto}
                  </span>
                </div>
                <span className="sd-fecha">
                  {new Date(sol.fecha_solicitud).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* PRODUCTO / VARIANTE con grid de atributos */}
              {sol.variante && (
                <div className="sd-producto">
                  {sol.variante.imagen_url && (
                    <img
                      src={sol.variante.imagen_url}
                      alt={sol.variante.producto}
                      className="sd-producto__img"
                    />
                  )}
                  <div className="sd-producto__info">
                    <strong className="sd-producto__nombre">{sol.variante.producto}</strong>
                    <div className="sd-atributos-grid">
                      {sol.variante.color && (
                        <>
                          <span className="sd-atributo-label">Color:</span>
                          <span className="sd-atributo-valor">{sol.variante.color}</span>
                        </>
                      )}
                      <span className="sd-atributo-label">Precio base:</span>
                      <span className="sd-atributo-valor">${precioBaseNum.toFixed(2)}</span>

                      {costoDisenoNum > 0 && (
                        <>
                          <span className="sd-atributo-label">Costo diseño:</span>
                          <span className="sd-atributo-valor sd-costo-diseno">${costoDisenoNum.toFixed(2)}</span>
                        </>
                      )}
                      <span className="sd-atributo-label">Total estimado:</span>
                      <span className="sd-atributo-valor sd-total">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DESCRIPCIÓN DEL CLIENTE */}
              <div className="sd-seccion">
                <p className="sd-label">Descripción</p>
                <p className="sd-descripcion">{sol.descripcion_cliente}</p>
              </div>

              {/* OBSERVACIONES DEL ADMIN */}
              {sol.observaciones_admin && (
                <div className="sd-observaciones">
                  <p className="sd-label">📋 Nota del equipo</p>
                  <p>{sol.observaciones_admin}</p>
                </div>
              )}

              {/* ARCHIVOS DE REFERENCIA */}
              {sol.archivos_referencia?.length > 0 && (
                <div className="sd-seccion">
                  <p className="sd-label">Archivos de referencia</p>
                  <div className="sd-archivos-grid">
                    {sol.archivos_referencia.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sd-archivo-preview"
                      >
                        <img
                          src={url}
                          alt={`Referencia ${idx + 1}`}
                          className="sd-archivo-img"
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="sd-archivo-fallback" style={{ display: 'none' }}>
                          📎 Archivo {idx + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* PROPUESTAS DEL DISEÑADOR */}
              {sol.propuestas?.length > 0 && (
                <div className="sd-seccion">
                  <p className="sd-label">Propuestas del diseñador</p>
                  <div className="sd-propuestas-lista">
                    {sol.propuestas.map(prop => (
                      <div
                        key={prop.id}
                        className={`sd-propuesta ${prop.es_aprobada ? 'sd-propuesta--aprobada' : ''}`}
                      >
                        <img
                          src={prop.imagen_url}
                          alt="Propuesta de diseño"
                          className="sd-propuesta__img"
                        />
                        <div className="sd-propuesta__info">
                          <p className="sd-propuesta__desc">{prop.descripcion}</p>
                          <small className="sd-propuesta__fecha">
                            Enviada: {new Date(prop.fecha_envio).toLocaleDateString('es-MX')}
                          </small>
                          {prop.es_aprobada && (
                            <span className="sd-badge-aprobada">✅ Aprobada</span>
                          )}
                        </div>
                        {!prop.es_aprobada && sol.estado === 'propuesta_enviada' && (
                          <button
                            className="sd-btn sd-btn--aprobar"
                            disabled={aprobando === prop.id}
                            onClick={() =>
                              aprobarPropuesta(
                                sol.id,
                                prop.id,
                                sol.costo_diseno,
                                sol.variante?.id,
                                sol.variante?.precio_base
                              )
                            }
                          >
                            {aprobando === prop.id ? 'Aprobando...' : 'Aprobar propuesta'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SolicitudesDiseno;