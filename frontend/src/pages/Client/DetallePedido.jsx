// src/pages/Client/DetallePedido.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/DetallePedido.css';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ Estados del pedido
const ESTADO_CONFIG = {
  PENDIENTE_VERIFICACION: { texto: "⏳ Anticipo pendiente", color: "#f59e0b", bg: "#fef3c7" },
  EN_DISENO: { texto: "🎨 En diseño", color: "#3b82f6", bg: "#eff6ff" },
  EN_REVISION: { texto: "🔍 En revisión", color: "#8b5cf6", bg: "#f5f3ff" },
  PREVIAS_ENVIADAS: { texto: "👁️ Previa lista", color: "#06b6d4", bg: "#ecfeff" },
  EN_PRODUCCION: { texto: "🏭 En producción", color: "#10b981", bg: "#ecfdf5" },
  PENDIENTE_PAGO_FINAL: { texto: "💰 Pago final pendiente", color: "#f59e0b", bg: "#fef3c7" },
  VERIFICANDO_PAGO_FINAL: { texto: "🔍 Verificando pago final", color: "#8b5cf6", bg: "#f5f3ff" },
  ENVIADO: { texto: "📦 Enviado", color: "#16a34a", bg: "#dcfce7" },
  CANCELADO: { texto: "❌ Cancelado", color: "#dc2626", bg: "#fee2e2" },
};

const DetallePedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ─── ESTADO DEL CHAT ─────────────────────────────────────────────
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const chatContainerRef = useRef(null);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  // ─── FETCH PEDIDO ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchPedido = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/client/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedido(res.data);
        console.log('📦 Pedido cargado:', res.data);
      } catch (err) {
        console.error('❌ Error al cargar pedido:', err);
        console.error('❌ Respuesta:', err.response?.data);
        setError(err.response?.data?.message || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  // ─── FETCH MENSAJES ──────────────────────────────────────────────
  const fetchMensajes = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/client/chat/${id}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensajes(res.data.mensajes || []);
      // Scroll al final del chat
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('❌ Error al obtener mensajes:', err);
      setChatError('No se pudieron cargar los mensajes');
    }
  };

  // ─── ENVIAR MENSAJE ──────────────────────────────────────────────
  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setChatLoading(true);
    setChatError(null);

    try {
      await axios.post(
        `${API_URL}/api/client/chat/${id}/chat`,
        { mensaje: nuevoMensaje.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNuevoMensaje('');
      await fetchMensajes();
    } catch (err) {
      console.error('❌ Error al enviar mensaje:', err);
      setChatError('No se pudo enviar el mensaje');
    } finally {
      setChatLoading(false);
    }
  };

  // ─── POLLING DE MENSAJES ─────────────────────────────────────────
  useEffect(() => {
    if (!pedido) return;

    // Solo cargar chat si el pedido está en estados de diseño/revisión
    const estadosConChat = ['EN_REVISION', 'PREVIAS_ENVIADAS', 'EN_DISENO'];
    if (estadosConChat.includes(pedido.estado)) {
      fetchMensajes();

      // Polling cada 10 segundos
      const interval = setInterval(fetchMensajes, 10000);
      return () => clearInterval(interval);
    }
  }, [pedido]);

  // ─── ENTER PARA ENVIAR MENSAJE ───────────────────────────────────
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  // ─── RENDER ──────────────────────────────────────────────────────
  if (loading) return <div className="detalle-loading">Cargando...</div>;
  if (error) return <div className="detalle-error">{error}</div>;
  if (!pedido) return <div className="detalle-error">Pedido no encontrado</div>;

  const estadoInfo = ESTADO_CONFIG[pedido.estado] || { texto: pedido.estado, color: "#6b7280", bg: "#f3f4f6" };
  const mostrarChat = ['EN_REVISION', 'PREVIAS_ENVIADAS', 'EN_DISENO'].includes(pedido.estado);

  return (
    <div className="detalle-pedido-wrapper">
      {/* ─── HEADER ─── */}
      <div className="detalle-pedido-header">
        <button onClick={() => navigate('/cliente/pedidos')} className="btn-volver">
          ← Volver a mis pedidos
        </button>
        <div className="detalle-pedido-titulo">
          <h2>Pedido #{pedido.id}</h2>
          <span
            className="detalle-estado"
            style={{ color: estadoInfo.color, background: estadoInfo.bg }}
          >
            {estadoInfo.texto}
          </span>
        </div>
      </div>

      {/* ─── LAYOUT PRINCIPAL: chat a la izquierda, detalle a la derecha ─── */}
      <div className={`detalle-pedido-layout ${mostrarChat ? 'con-chat' : 'sin-chat'}`}>

        {/* ─── COLUMNA IZQUIERDA: CHAT ─── */}
        {mostrarChat && (
          <div className="detalle-chat">
            <div className="chat-header">
              <div className="chat-header-titulo">
                <h3>💬 Chat con el equipo</h3>
                <span className="chat-status online">🟢 En línea</span>
              </div>
            </div>

            <div className="chat-mensajes" ref={chatContainerRef}>
              {mensajes.length === 0 ? (
                <div className="chat-empty">
                  <span>💬</span>
                  <p>No hay mensajes aún. Inicia la conversación con el equipo.</p>
                </div>
              ) : (
                mensajes.map((msg, index) => {
                  const esAdmin = msg.remitente_rol === 'admin';
                  return (
                    <div
                      key={index}
                      className={`chat-mensaje ${esAdmin ? 'admin' : 'cliente'}`}
                    >
                      <div className="chat-mensaje-header">
                        <strong>{msg.remitente_nombre}</strong>
                        {esAdmin && <span className="chat-badge">Admin</span>}
                        <span className="chat-hora">
                          {new Date(msg.fecha_envio).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="chat-mensaje-texto">{msg.mensaje}</p>
                      {!msg.leido && esAdmin && (
                        <span className="chat-no-leido">● No leído</span>
                      )}
                    </div>
                  );
                })
              )}
              {chatLoading && (
                <div className="chat-loading">
                  <span>⏳ Enviando...</span>
                </div>
              )}
            </div>

            {chatError && (
              <div className="chat-error">{chatError}</div>
            )}

            <div className="chat-input-area">
              <textarea
                className="chat-input"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                rows="2"
              />
              <button
                className="chat-enviar"
                onClick={enviarMensaje}
                disabled={chatLoading || !nuevoMensaje.trim()}
              >
                {chatLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        )}

        {/* ─── COLUMNA DERECHA: INFO, PRODUCTOS, PAGOS, ACCIONES ─── */}
        <div className="detalle-pedido-main">

          {/* ─── INFO + PRODUCTOS ─── */}
          <div className="detalle-pedido-grid">
            <div className="detalle-info">
              <h3>📋 Información del pedido</h3>
              <div className="info-linea">
                <span>Fecha:</span>
                <span>{new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
              </div>
              <div className="info-linea">
                <span>Método de entrega:</span>
                <span>{pedido.metodo_entrega_nombre || 'No especificado'}</span>
              </div>
              <div className="info-linea">
                <span>Dirección:</span>
                <span>{pedido.direccion_envio || 'No especificada'}</span>
              </div>
              {pedido.distancia_km_calculada && (
                <div className="info-linea">
                  <span>Distancia:</span>
                  <span>{pedido.distancia_km_calculada} km</span>
                </div>
              )}
              <div className="info-linea">
                <span>Fecha estimada:</span>
                <span>{pedido.fecha_entrega_estimada ? new Date(pedido.fecha_entrega_estimada).toLocaleDateString() : 'Por definir'}</span>
              </div>
              <div className="info-linea total">
                <span>Total:</span>
                <span>${pedido.total_general}</span>
              </div>
            </div>

            <div className="detalle-productos">
              <h3>🛒 Productos</h3>
              {pedido.detalles?.length > 0 ? (
                pedido.detalles.map((detalle, index) => (
                  <div key={index} className="producto-item">
                    <img
                      src={detalle.imagen_url || '/placeholder.png'}
                      alt={detalle.producto_nombre}
                      onError={(e) => (e.target.src = '/placeholder.png')}
                    />
                    <div className="producto-info">
                      <h4>{detalle.producto_nombre}</h4>
                      <p>Color: {detalle.color || 'N/A'}</p>
                      <p>Cantidad: {detalle.cantidad}</p>
                      <p>Precio unitario: ${detalle.precio_unitario}</p>
                    </div>
                    <div className="producto-precio">
                      ${detalle.subtotal}
                    </div>
                  </div>
                ))
              ) : (
                <p className="producto-vacio">No hay productos en este pedido</p>
              )}
              <div className="producto-total">
                <span>Subtotal productos:</span>
                <span>${pedido.total_productos}</span>
              </div>
              <div className="producto-total">
                <span>Envío:</span>
                <span>${pedido.costo_envio}</span>
              </div>
              <div className="producto-total grand-total">
                <span>Total:</span>
                <span>${pedido.total_general}</span>
              </div>
            </div>
          </div>

          {/* ─── PAGOS ─── */}
          <div className="detalle-pagos">
            <h3>💳 Pagos</h3>
            {pedido.pagos?.length > 0 ? (
              <div className="pagos-lista">
                {pedido.pagos.map((pago, index) => (
                  <div key={index} className="pago-item">
                    <div className="pago-item-fila-principal">
                      <div className="pago-item-info">
                        <span className="pago-tipo">{pago.tipo_pago}</span>
                        <span className="pago-monto">${pago.monto}</span>
                      </div>
                      <span className={`pago-estado ${pago.estado_pago?.toLowerCase() || 'pendiente'}`}>
                        {pago.estado_pago === 'PENDIENTE' ? '⏳ En verificación' :
                         pago.estado_pago === 'APROBADO' ? '✅ Aprobado' :
                         pago.estado_pago === 'RECHAZADO' ? '❌ Rechazado' : pago.estado_pago || 'Pendiente'}
                      </span>
                    </div>
                    {(pago.comprobante_url || pago.notas_admin) && (
                      <div className="pago-item-fila-secundaria">
                        {pago.comprobante_url && (
                          <a href={pago.comprobante_url} target="_blank" rel="noopener noreferrer" className="pago-comprobante">
                            📎 Ver comprobante
                          </a>
                        )}
                        {pago.notas_admin && (
                          <span className="pago-notas">📝 {pago.notas_admin}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="pago-vacio">No hay pagos registrados</p>
            )}
          </div>

          {/* ─── ACCIONES ─── */}
          <div className="detalle-acciones">
            {pedido.estado === 'PENDIENTE_VERIFICACION' && (
              <button className="btn-accion btn-pago" onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}>
                <span className="btn-accion-icono">📎</span>
                <span>Subir comprobante de pago</span>
              </button>
            )}
            {pedido.estado === 'EN_DISENO' && (
              <>
                <button className="btn-accion btn-diseno" onClick={() => navigate(`/cliente/pedido/${pedido.id}/editor`)}>
                  <span className="btn-accion-icono">🎨</span>
                  <span>Editor interactivo</span>
                </button>
                <button className="btn-accion btn-subir" onClick={() => navigate(`/cliente/pedido/${pedido.id}/diseno`)}>
                  <span className="btn-accion-icono">📎</span>
                  <span>Subir archivo</span>
                </button>
              </>
            )}
            {pedido.estado === 'PENDIENTE_PAGO_FINAL' && (
              <button className="btn-accion btn-pago" onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}>
                <span className="btn-accion-icono">💰</span>
                <span>Pagar saldo restante</span>
              </button>
            )}
            {pedido.estado === 'PREVIAS_ENVIADAS' && (
              <button className="btn-accion btn-previa" onClick={() => navigate(`/cliente/pedido/${pedido.id}/previas`)}>
                <span className="btn-accion-icono">🖼️</span>
                <span>Ver previas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePedido;