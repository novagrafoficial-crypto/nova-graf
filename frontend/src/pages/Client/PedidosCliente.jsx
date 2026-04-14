// frontend/src/pages/client/PedidosCliente.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../utils/auth';
import '../../styles/client/PedidosCliente.css';

const API_URL = import.meta.env.VITE_API_URL;

// ─── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;

  return (
    <div className="ped-modal-overlay" onClick={onCancelar}>
      <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ped-modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="ped-modal-titulo">Confirmar cancelación</h2>
        <p className="ped-modal-mensaje">{mensaje}</p>
        <div className="ped-modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción no se puede deshacer.</span>
        </div>
        <div className="ped-modal-botones">
          <button className="ped-modal-btn ped-modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="ped-modal-btn ped-modal-btn--confirmar" onClick={onConfirmar}>
            Sí, cancelar pedido
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL DE NOTIFICACIÓN ─────────────────────────────────────────
const ModalNotificacion = ({ visible, tipo, titulo, mensaje, onCerrar }) => {
  if (!visible) return null;

  const esExito = tipo === 'exito';
  const icono = esExito ? '✅' : '❌';
  const fondoIcono = esExito ? '#dcfce7' : '#fee2e2';

  return (
    <div className="ped-modal-overlay" onClick={onCerrar}>
      <div className="ped-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ped-modal-icon" style={{ background: fondoIcono }}>
          <span style={{ fontSize: '28px' }}>{icono}</span>
        </div>
        <h2 className="ped-modal-titulo">{titulo}</h2>
        <p className="ped-modal-mensaje">{mensaje}</p>
        <div className="ped-modal-aviso">
          <span>ℹ️</span>
          <span>{esExito ? 'La acción se completó correctamente.' : 'Por favor, intenta de nuevo.'}</span>
        </div>
        <button className="ped-modal-boton" onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

const PedidosCliente = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los modales
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    pedidoId: null,
    mensaje: '',
  });
  const [notifModal, setNotifModal] = useState({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });

  const mostrarConfirmacion = (pedidoId, mensaje) => {
    setConfirmModal({ visible: true, pedidoId, mensaje });
  };

  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, pedidoId: null, mensaje: '' });
  };

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };

  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  // Cancelar pedido (simulación)
  const handleCancelarPedido = async () => {
    const { pedidoId } = confirmModal;
    cerrarConfirmacion();

    try {
      const token = getToken();
      if (!token) {
        mostrarNotificacion('error', 'Sesión no iniciada', 'Debes iniciar sesión para cancelar pedidos.');
        return;
      }

      // Llamada real al backend (si existe)
      // const res = await fetch(`${API_URL}/api/client/pedidos/${pedidoId}/cancelar`, {
      //   method: 'PUT',
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // if (!res.ok) throw new Error();

      // SIMULACIÓN: actualizar estado local
      setPedidos(prev =>
        prev.map(p =>
          p.id === pedidoId ? { ...p, estado: 'Cancelado' } : p
        )
      );

      mostrarNotificacion('exito', 'Pedido cancelado', 'El pedido ha sido cancelado exitosamente.');
    } catch (err) {
      console.error(err);
      mostrarNotificacion('error', 'Error', 'No se pudo cancelar el pedido. Intenta de nuevo.');
    }
  };

  useEffect(() => {
    const fetchPedidos = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // Intentar obtener pedidos reales del backend
      try {
        const res = await fetch(`${API_URL}/api/client/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPedidos(data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('No se pudo conectar al backend, usando simulación local');
      }

      // SIMULACIÓN: leer pedidos guardados en localStorage
      try {
        const stored = localStorage.getItem('pedidos_simulados');
        const pedidosSimulados = stored ? JSON.parse(stored) : [];
        const pedidosNormalizados = pedidosSimulados.map(pedido => ({
          ...pedido,
          total: Number(pedido.total) || 0,
          items: pedido.items.map(item => ({
            ...item,
            precio_unitario: Number(item.precio_unitario) || 0,
          }))
        }));
        pedidosNormalizados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setPedidos(pedidosNormalizados);
      } catch (err) {
        console.error(err);
        setError('Error al cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [navigate]);

  if (loading) return <div className="pedidos-loading">Cargando tus compras...</div>;
  if (error) return <div className="pedidos-error">{error}</div>;

  return (
    <div className="pedidos-wrapper">
      {/* Modales */}
      <ModalConfirmacion
        visible={confirmModal.visible}
        mensaje={confirmModal.mensaje}
        onConfirmar={handleCancelarPedido}
        onCancelar={cerrarConfirmacion}
      />
      <ModalNotificacion
        visible={notifModal.visible}
        tipo={notifModal.tipo}
        titulo={notifModal.titulo}
        mensaje={notifModal.mensaje}
        onCerrar={cerrarNotificacion}
      />

      {/* Hero header */}
      <div className="pedidos-header">
        <h2 className="pedidos-titulo">Mis compras</h2>
        <p className="pedidos-subtitulo">
          Revisa el historial de todos tus pedidos realizados.
        </p>
      </div>

      <div className="pedidos-contenido">
        {pedidos.length === 0 ? (
          <div className="pedidos-empty">
            <p>No has realizado ninguna compra aún.</p>
            <button onClick={() => navigate('/cliente/catalogo')}>Ver catálogo</button>
          </div>
        ) : (
          <div className="pedidos-lista">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="pedido-card">
                <div className="pedido-header">
                  <span className="pedido-id">Pedido #{pedido.id}</span>
                  <span className="pedido-fecha">
                    {new Date(pedido.fecha).toLocaleDateString('es-MX')}
                  </span>
                  <span className={`pedido-estado ${pedido.estado?.toLowerCase()}`}>
                    {pedido.estado || 'Completado'}
                  </span>
                  {/* Botón cancelar solo si el pedido no está ya cancelado */}
                  {pedido.estado !== 'Cancelado' && (
                    <button
                      className="pedido-cancelar-btn"
                      onClick={() => mostrarConfirmacion(pedido.id, `¿Estás seguro de cancelar el pedido #${pedido.id}?`)}
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
                <div className="pedido-items">
                  {pedido.items.map((item, idx) => (
                    <div key={idx} className="pedido-item">
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="pedido-item-img"
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <div className="pedido-item-info">
                        <h4>{item.nombre}</h4>
                        <p>Cantidad: {item.cantidad}</p>
                        <p>Precio unitario: ${item.precio_unitario.toFixed(2)}</p>
                        {item.texto_personalizado && (
                          <p className="pedido-item-texto">Texto: {item.texto_personalizado}</p>
                        )}
                      </div>
                      <div className="pedido-item-total">
                        ${(item.cantidad * item.precio_unitario).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pedido-footer">
                  <div className="pedido-total">
                    Total: <strong>${pedido.total.toFixed(2)}</strong>
                  </div>
                  <div className="pedido-entrega">
                    Entrega: {pedido.forma_entrega === 'domicilio' ? '🚚 Domicilio' :
                              pedido.forma_entrega === 'punto_entrega' ? '📦 Punto de entrega' :
                              '🏬 Retiro en tienda'}
                  </div>
                  <div className="pedido-pago">
                    Pago: {pedido.forma_pago === 'tarjeta' ? '💳 Tarjeta' :
                           pedido.forma_pago === 'transferencia' ? '🏦 Transferencia' :
                           '💰 Depósito'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosCliente;