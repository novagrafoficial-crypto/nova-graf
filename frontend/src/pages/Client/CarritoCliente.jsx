// src/pages/Client/CarritoCliente.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import '../../styles/client/Carrito.css';

// ─── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;
  return (
    <div className="cart-modal-overlay" onClick={onCancelar}>
      <div className="cart-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="cart-modal-titulo">Confirmar acción</h2>
        <p className="cart-modal-mensaje">{mensaje}</p>
        <div className="cart-modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción no se puede deshacer.</span>
        </div>
        <div className="cart-modal-botones">
          <button className="cart-modal-btn cart-modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="cart-modal-btn cart-modal-btn--confirmar" onClick={onConfirmar}>
            Sí, eliminar
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
    <div className="cart-modal-overlay" onClick={onCerrar}>
      <div className="cart-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cart-modal-icon" style={{ background: fondoIcono }}>
          <span style={{ fontSize: '28px' }}>{icono}</span>
        </div>
        <h2 className="cart-modal-titulo">{titulo}</h2>
        <p className="cart-modal-mensaje">{mensaje}</p>
        <div className="cart-modal-aviso">
          <span>ℹ️</span>
          <span>{esExito ? 'La acción se completó correctamente.' : 'Por favor, intenta de nuevo.'}</span>
        </div>
        <button className="cart-modal-boton-unico" onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

const CarritoCliente = () => {
  const navigate = useNavigate();
  const { 
    cartItems = [], 
    cartTotal = 0, 
    refreshCart, 
    updateQuantity, 
    removeFromCart 
  } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modales
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    detalleId: null,
    mensaje: ''
  });
  const [notifModal, setNotifModal] = useState({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: ''
  });

  const mostrarConfirmacion = (detalleId, mensaje) => {
    setConfirmModal({ visible: true, detalleId, mensaje });
  };
  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, detalleId: null, mensaje: '' });
  };
  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };
  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  // Cargar carrito al montar
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      await refreshCart();
      setLoading(false);
    };
    loadCart();
  }, [refreshCart]);

  const handleActualizarCantidad = async (detalleId, cantidad) => {
    if (cantidad < 1) return;
    try {
      await updateQuantity(detalleId, cantidad);
      mostrarNotificacion('exito', 'Cantidad actualizada', 'El producto se actualizó correctamente.');
    } catch (err) {
      mostrarNotificacion('error', 'Error', 'No se pudo actualizar la cantidad.');
    }
  };

  const handleEliminar = async () => {
    const { detalleId } = confirmModal;
    cerrarConfirmacion();
    try {
      await removeFromCart(detalleId);
      mostrarNotificacion('exito', 'Producto eliminado', 'El producto se eliminó del carrito.');
    } catch (err) {
      mostrarNotificacion('error', 'Error', 'No se pudo eliminar el producto.');
    }
  };

  if (loading) return <div className="carrito-loading">Cargando carrito…</div>;
  if (error) return <div className="carrito-error">{error}</div>;

  return (
    <div className="carrito-wrapper">
      {/* Modales */}
      <ModalConfirmacion
        visible={confirmModal.visible}
        mensaje={confirmModal.mensaje}
        onConfirmar={handleEliminar}
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
      <div className="carrito-header">
        <h2 className="carrito-titulo">Mi carrito</h2>
        <p className="carrito-subtitulo">
          Revisa los productos que has seleccionado y confirma tu pedido.
        </p>
      </div>

      <div className="carrito-contenido">
        {cartItems.length === 0 ? (
          <div className="carrito-empty">
            <p>Tu carrito está vacío</p>
            <button onClick={() => navigate('/cliente/catalogo')}>Ver catálogo</button>
          </div>
        ) : (
          <div className="carrito-container">
            <div className="carrito-items">
              {cartItems.map(item => (
                <div key={item.detalle_id} className="carrito-item">
                  <div className="carrito-item__img">
                    <img 
                      src={item.imagen_url || 'https://placehold.co/100x100?text=Sin+imagen'} 
                      alt={item.producto_nombre} 
                    />
                  </div>
                  <div className="carrito-item__info">
                    <h3>{item.producto_nombre}</h3>
                    <p>Color: {item.color || 'N/A'}</p>
                    <p className="carrito-item__price">
                      Precio unitario: ${parseFloat(item.precio_unitario).toFixed(2)}
                    </p>
                  </div>
                  <div className="carrito-item__actions">
                    <div className="cantidad-control">
                      <button 
                        onClick={() => handleActualizarCantidad(item.detalle_id, item.cantidad - 1)}
                        disabled={item.cantidad <= 1}
                      >
                        −
                      </button>
                      <span>{item.cantidad}</span>
                      <button 
                        onClick={() => handleActualizarCantidad(item.detalle_id, item.cantidad + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p className="carrito-item__subtotal">
                      Subtotal: ${parseFloat(item.subtotal).toFixed(2)}
                    </p>
                    <button 
                      className="btn-eliminar" 
                      onClick={() => mostrarConfirmacion(item.detalle_id, `¿Eliminar "${item.producto_nombre}" del carrito?`)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="carrito-resumen">
              <h2>Resumen</h2>
              <p>Total: <strong>${cartTotal.toFixed(2)}</strong></p>
              <button className="btn-checkout" onClick={() => navigate('/cliente/checkout')}>
                Proceder al pago
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarritoCliente;