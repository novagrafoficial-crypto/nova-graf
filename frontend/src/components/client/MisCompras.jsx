// frontend/src/components/client/MisCompras.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";
import "../../styles/client/MisCompras.css";

const API_BASE = import.meta.env.VITE_API_URL;

const ESTADO_CONFIG = {
  ENVIADO: { texto: "📦 Entregado", color: "#16a34a", bg: "#dcfce7" }
};

function MisCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchCompras = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      // ✅ USAR EL MISMO ENDPOINT QUE FUNCIONA
      const res = await fetch(`${API_BASE}/api/client/pedidos`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) throw new Error("Error al cargar compras");
      
      const data = await res.json();
      console.log("📦 Todos los pedidos:", data);
      
      // ✅ FILTRAR SOLO LOS QUE ESTÁN EN ESTADO 'ENVIADO'
      const enviados = data.filter(pedido => pedido.estado === 'ENVIADO');
      console.log("📦 Pedidos ENVIADO:", enviados);
      
      setCompras(enviados);
    } catch (err) {
      setError("No se pudieron cargar tus compras.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  if (loading) {
    return (
      <div className="mc-loading">
        <div className="mc-spinner"></div>
        <p>Cargando tus compras...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mc-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={fetchCompras} className="mc-retry-btn">
          Reintentar
        </button>
      </div>
    );
  }

  if (compras.length === 0) {
    return (
      <div className="mc-empty">
        <span>📦</span>
        <h3>No tienes compras realizadas</h3>
        <p>Cuando tus pedidos sean entregados, aparecerán aquí.</p>
        <button onClick={() => navigate('/cliente/catalogo')} className="mc-empty-btn">
          Ir a comprar
        </button>
      </div>
    );
  }

  return (
    <div className="mc-wrapper">
      <div className="mc-header">
        <h1>Mis Compras</h1>
        <p>Historial de productos que ya has recibido</p>
      </div>

      <div className="mc-grid">
        {compras.map((compra) => {
          const estadoInfo = ESTADO_CONFIG[compra.estado] || {
            texto: compra.estado,
            color: "#6b7280",
            bg: "#f3f4f6"
          };

          return (
            <div key={compra.id} className="mc-card">
              {/* ─── CABECERA ─── */}
              <div className="mc-card-header">
                <div className="mc-card-id">
                  <span className="mc-id-label">Pedido</span>
                  <span className="mc-id-number">#{compra.id}</span>
                </div>
                <div className="mc-card-fecha">
                  {new Date(compra.fecha_pedido).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                </div>
              </div>

              {/* ─── PRODUCTOS ─── */}
              <div className="mc-card-productos">
                {(compra.detalles || []).slice(0, 3).map((item, idx) => (
                  <div key={idx} className="mc-producto">
                    {item.imagen_url && (
                      <img
                        src={item.imagen_url}
                        alt={item.producto_nombre}
                        className="mc-producto-img"
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                    )}
                    <div className="mc-producto-info">
                      <h4>{item.producto_nombre}</h4>
                      <p>{item.color && `Color: ${item.color}`}</p>
                      <p className="mc-producto-cantidad">x{item.cantidad}</p>
                    </div>
                    <div className="mc-producto-precio">
                      ${Number(item.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
                {(compra.detalles || []).length > 3 && (
                  <div className="mc-producto-mas">
                    + {(compra.detalles || []).length - 3} producto(s) más
                  </div>
                )}
              </div>

              {/* ─── PIE ─── */}
              <div className="mc-card-footer">
                <div className="mc-card-total">
                  <span className="mc-total-label">Total pagado</span>
                  <span className="mc-total-valor">${Number(compra.total_general).toFixed(2)}</span>
                </div>
                <div className="mc-card-estado">
                  <span
                    className="mc-estado-badge"
                    style={{
                      color: estadoInfo.color,
                      background: estadoInfo.bg,
                    }}
                  >
                    {estadoInfo.texto}
                  </span>
                </div>
                <button
                  className="mc-btn-detalle"
                  onClick={() => navigate(`/cliente/pedido/${compra.id}`)}
                >
                  Ver detalle →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MisCompras;