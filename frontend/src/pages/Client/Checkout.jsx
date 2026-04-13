import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import '../../styles/client/Checkout.css';

const API_URL = import.meta.env.VITE_API_URL;

// ─── MODAL DE NOTIFICACIÓN ─────────────────────────────────────────
const ModalNotificacion = ({ visible, tipo, titulo, mensaje, onCerrar }) => {
  if (!visible) return null;

  const esExito = tipo === 'exito';
  const icono = esExito ? '✅' : '❌';
  const fondoIcono = esExito ? '#dcfce7' : '#fee2e2';

  return (
    <div className="checkout-modal-overlay" onClick={onCerrar}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-icon" style={{ background: fondoIcono }}>
          <span style={{ fontSize: '28px' }}>{icono}</span>
        </div>
        <h2 className="checkout-modal-titulo">{titulo}</h2>
        <p className="checkout-modal-mensaje">{mensaje}</p>
        <div className="checkout-modal-aviso">
          <span>ℹ️</span>
          <span>{esExito ? 'La acción se completó correctamente.' : 'Por favor, intenta de nuevo.'}</span>
        </div>
        <button className="checkout-modal-boton" onClick={onCerrar}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

// ─── MODAL DE CONFIRMACIÓN ─────────────────────────────────────────
const ModalConfirmacion = ({ visible, mensaje, onConfirmar, onCancelar }) => {
  if (!visible) return null;

  return (
    <div className="checkout-modal-overlay" onClick={onCancelar}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-icon" style={{ background: '#fee2e2' }}>
          <span style={{ fontSize: '28px' }}>⚠️</span>
        </div>
        <h2 className="checkout-modal-titulo">Confirmar compra</h2>
        <p className="checkout-modal-mensaje">{mensaje}</p>
        <div className="checkout-modal-aviso">
          <span>ℹ️</span>
          <span>Esta acción simulará la compra.</span>
        </div>
        <div className="checkout-modal-botones">
          <button className="checkout-modal-btn checkout-modal-btn--cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="checkout-modal-btn checkout-modal-btn--confirmar" onClick={onConfirmar}>
            Sí, confirmar compra
          </button>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [paso, setPaso] = useState('entrega'); // 'entrega' o 'pago'

  // Forma de entrega
  const [formaEntrega, setFormaEntrega] = useState('');
  const [direccion, setDireccion] = useState('');

  // Forma de pago (simulación)
  const [formaPago, setFormaPago] = useState('tarjeta');
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    nombre: '',
    fecha: '',
    cvv: ''
  });

  // Estados para modales
  const [notifModal, setNotifModal] = useState({
    visible: false,
    tipo: 'exito',
    titulo: '',
    mensaje: '',
  });
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    mensaje: '',
    onConfirm: null,
  });

  const mostrarNotificacion = (tipo, titulo, mensaje) => {
    setNotifModal({ visible: true, tipo, titulo, mensaje });
  };

  const cerrarNotificacion = () => {
    setNotifModal({ ...notifModal, visible: false });
  };

  const mostrarConfirmacion = (mensaje, onConfirm) => {
    setConfirmModal({ visible: true, mensaje, onConfirm });
  };

  const cerrarConfirmacion = () => {
    setConfirmModal({ visible: false, mensaje: '', onConfirm: null });
  };

  // Cargar carrito desde el backend
  useEffect(() => {
    const fetchCarrito = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/client/carrito`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Error al cargar carrito');
        const data = await res.json();
        setItems(data);
        const totalCalc = data.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
        setTotal(totalCalc);
      } catch (err) {
        console.error(err);
        mostrarNotificacion('error', 'Error', 'No se pudo cargar el carrito. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchCarrito();
  }, [navigate]);

  // Validar y pasar al paso de pago
  const handleContinuarEntrega = () => {
    if (!formaEntrega) {
      mostrarNotificacion('error', 'Forma de entrega', 'Por favor selecciona una forma de entrega');
      return;
    }
    if (formaEntrega === 'domicilio' && !direccion.trim()) {
      mostrarNotificacion('error', 'Dirección requerida', 'Ingresa tu dirección completa');
      return;
    }
    setPaso('pago');
  };

  // Simular compra (llamada después de confirmación)
  const ejecutarCompra = async () => {
  setProcesando(true);
  const token = getToken();

  const payload = {
    formaPago: formaPago,      // 'tarjeta', 'efectivo', 'deposito' (según tus opciones)
    formaEntrega: formaEntrega, // 'domicilio', 'punto_entrega', 'tienda'
    direccion: formaEntrega === 'domicilio' ? direccion : null,
    datosTarjeta: formaPago === 'tarjeta' ? datosTarjeta : null,
  };
  

  try {
    const response = await fetch(`${API_URL}/api/client/checkout/procesar`, { // ← Ruta corregida
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error en la compra');

    mostrarNotificacion('exito', '¡Compra realizada!', data.mensaje);
    refreshCart(); // Limpia el contexto del carrito

    const cerrarYRedirigir = () => {
      setNotifModal(prev => ({ ...prev, visible: false }));
      navigate('/cliente/pedidos');
    };
    setNotifModal(prev => ({ ...prev, onCerrar: cerrarYRedirigir }));
  } catch (err) {
    console.error(err);
    mostrarNotificacion('error', 'Error', err.message);
  } finally {
    setProcesando(false);
  }
};

  const handleSimularCompra = (e) => {
    e.preventDefault();

    // Validaciones previas
    if (formaPago === 'tarjeta') {
      if (!datosTarjeta.numero || !datosTarjeta.nombre || !datosTarjeta.fecha || !datosTarjeta.cvv) {
        mostrarNotificacion('error', 'Datos incompletos', 'Completa todos los datos de la tarjeta');
        return;
      }
      const numLimpio = datosTarjeta.numero.replace(/\s/g, '');
      if (numLimpio.length < 16) {
        mostrarNotificacion('error', 'Número inválido', 'La tarjeta debe tener 16 dígitos');
        return;
      }
    }

    // Mostrar modal de confirmación antes de ejecutar
    mostrarConfirmacion('¿Estás seguro de realizar esta compra?', ejecutarCompra);
  };

  if (loading) return <div className="checkout-loading">Cargando resumen...</div>;
  if (items.length === 0) return <div className="checkout-empty">Tu carrito está vacío</div>;

  return (
    <div className="checkout-wrapper">
      {/* Modales */}
      <ModalNotificacion
        visible={notifModal.visible}
        tipo={notifModal.tipo}
        titulo={notifModal.titulo}
        mensaje={notifModal.mensaje}
        onCerrar={() => {
          if (notifModal.onCerrar) notifModal.onCerrar();
          else cerrarNotificacion();
        }}
      />
      <ModalConfirmacion
        visible={confirmModal.visible}
        mensaje={confirmModal.mensaje}
        onConfirmar={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
          cerrarConfirmacion();
        }}
        onCancelar={cerrarConfirmacion}
      />

      {/* ── HERO HEADER (mismo estilo que catálogo y carrito) ── */}
      <div className="checkout-header">
        <h2 className="checkout-titulo">Finalizar compra</h2>
        <p className="checkout-subtitulo">
          Revisa tu pedido y elige cómo recibirlo.
        </p>
      </div>

      <div className="checkout-contenido">
        {paso === 'entrega' ? (
          <div className="checkout-two-columns">
            {/* Columna izquierda: Resumen del pedido */}
            <div className="checkout-resumen">
              <h2>Resumen del pedido</h2>
              {items.map((item) => (
                <div key={item.carrito_id} className="resumen-item">
                  <div className="resumen-item__img">
                    <img
                      src={item.imagen_personalizada_url || item.variante_imagen}
                      alt={item.producto_nombre}
                    />
                  </div>
                  <div className="resumen-item__info">
                    <p><strong>{item.producto_nombre}</strong> x{item.cantidad}</p>
                    <p>Color: {item.color || 'N/A'}</p>
                    {item.texto_personalizado && <p>Texto: {item.texto_personalizado}</p>}
                    <p>${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="resumen-totales">
                <div className="total-line">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Envío</span>
                  <span>Gratis</span>
                </div>
                <div className="total-line grand-total">
                  <strong>Total</strong>
                  <strong>${total.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Columna derecha: Formas de entrega */}
            <div className="checkout-entrega">
              <h2>Elige la forma de entrega</h2>
              <div className="tarjetas-entrega">
                {/* Tarjeta domicilio */}
                <div
                  className={`tarjeta-entrega ${formaEntrega === 'domicilio' ? 'selected' : ''}`}
                  onClick={() => setFormaEntrega('domicilio')}
                >
                  <h3>🏠 Enviar a domicilio</h3>
                  <p>
                    Oriente 7 SN 1 - Parque de Poblamiento, Huejutla De Reyes - CP 43000<br />
                    Residencial
                  </p>
                  <button className="btn-modificar">Modificar domicilio o elegir otro</button>
                </div>

                {/* Tarjeta punto de entrega */}
                <div
                  className={`tarjeta-entrega ${formaEntrega === 'punto_entrega' ? 'selected' : ''}`}
                  onClick={() => setFormaEntrega('punto_entrega')}
                >
                  <h3>📦 Retirar en un punto de entrega</h3>
                  <p>
                    Agencia Mercado Libre - LARA DISEÑO Y CONTABILIDAD - TORIBIO REYES 91 - San José<br />
                    Lu a Vi: 9 a 18 hs.
                  </p>
                  <button className="btn-modificar">Ver punto en el mapa o elegir otro</button>
                </div>

                {/* Tarjeta retiro en tienda */}
                <div
                  className={`tarjeta-entrega ${formaEntrega === 'tienda' ? 'selected' : ''}`}
                  onClick={() => setFormaEntrega('tienda')}
                >
                  <h3>🏬 Retirar en tienda</h3>
                  <p>
                    Nuestra tienda física: Av. Principal #123, Centro<br />
                    Horario: Lunes a Sábado 10am - 8pm
                  </p>
                </div>
              </div>

              {formaEntrega === 'domicilio' && (
                <div className="domicilio-field">
                  <label>Dirección completa:</label>
                  <input
                    type="text"
                    placeholder="Calle, número, colonia, CP, referencia"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              )}

              <button className="btn-continuar" onClick={handleContinuarEntrega}>
                Continuar
              </button>
            </div>
          </div>
        ) : (
          // Paso de pago (simulación)
          <div className="checkout-pago-container">
            <h2>Selecciona método de pago</h2>
            <form onSubmit={handleSimularCompra} className="pago-form">
              <div className="form-group">
                <label>Método de pago</label>
                <select value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                  <option value="tarjeta">💳 Tarjeta de crédito/débito</option>
                  <option value="transferencia">🏦 Transferencia bancaria</option>
                  <option value="deposito">💰 Depósito en efectivo</option>
                </select>
              </div>

              {formaPago === 'tarjeta' && (
                <div className="tarjeta-form">
                  <div className="form-group">
                    <label>Número de tarjeta</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={datosTarjeta.numero}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero: e.target.value })}
                      maxLength="19"
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre del titular</label>
                    <input
                      type="text"
                      placeholder="Como aparece en la tarjeta"
                      value={datosTarjeta.nombre}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, nombre: e.target.value })}
                    />
                  </div>
                  <div className="row-fields">
                    <div className="form-group">
                      <label>Fecha expiración</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={datosTarjeta.fecha}
                        onChange={(e) => setDatosTarjeta({ ...datosTarjeta, fecha: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={datosTarjeta.cvv}
                        onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value })}
                        maxLength="4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formaPago === 'transferencia' && (
                <div className="info-bancaria">
                  <p><strong>Datos para transferencia:</strong></p>
                  <p>Banco: BBVA<br />Cuenta: 0123 4567 8901<br />CLABE: 012345678901234567<br />Referencia: TU_NOMBRE + PEDIDO</p>
                </div>
              )}

              {formaPago === 'deposito' && (
                <div className="info-bancaria">
                  <p><strong>Depósito en efectivo:</strong></p>
                  <p>Acude a cualquier sucursal BBVA y deposita a:<br />Cuenta: 0123 4567 8901<br />Envía el comprobante por WhatsApp al 555-123-4567</p>
                </div>
              )}

              <div className="pago-total">
                <p>Total a pagar: <strong>${total.toFixed(2)}</strong></p>
              </div>

              <button type="submit" disabled={procesando} className="btn-pagar">
                {procesando ? 'Procesando...' : 'Confirmar compra'}
              </button>
              <button type="button" className="btn-volver" onClick={() => setPaso('entrega')}>
                ← Volver a forma de entrega
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;