// src/pages/Client/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import '../../styles/client/Checkout.css';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ Catálogo de categorías de entrega (una sola fuente de verdad)
const CATEGORIAS_ENTREGA = [
  { key: 'TIENDA', label: 'Recoger en tienda', tipoInterno: 'RECOGIDA_FISICA' },
  { key: 'PUNTO_MEDIO', label: 'Punto medio de encuentro', tipoInterno: 'PUNTO_MEDIO' },
  { key: 'ENVIO_LOCAL', label: 'Envío a domicilio', tipoInterno: 'ENVIO_LOCAL' }
];

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems = [], cartTotal = 0, refreshCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [tiendasFisicas, setTiendasFisicas] = useState([]);
  const [puntosMedios, setPuntosMedios] = useState([]);
  const [colonias, setColonias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);

  const [categoriaEntrega, setCategoriaEntrega] = useState('');

  const [formData, setFormData] = useState({
    metodo_entrega_id: '',
    metodo_pago_id: '',
    direccion_envio: '',
    distancia_km: 0
  });

  const [error, setError] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);

  // ─── CARGAR DATOS ─────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoadingData(true);

        const [
          tiendasRes,
          puntosRes,
          coloniasRes,
          pagoRes
        ] = await Promise.all([
          axios.get(`${API_URL}/api/client/checkout/tiendas-fisicas`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/client/checkout/puntos-medios`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/client/checkout/colonias`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/client/checkout/metodos-pago`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setTiendasFisicas(tiendasRes.data || []);
        setPuntosMedios(puntosRes.data || []);
        setColonias(coloniasRes.data || []);
        setMetodosPago(pagoRes.data || []);

      } catch (err) {
        console.error(err);
        setError('Error al cargar métodos');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [navigate]);

  // ─── CALCULAR COSTO DE ENVÍO ─────────────────────────────────
  useEffect(() => {
    const todos = [...tiendasFisicas, ...puntosMedios, ...colonias];
    const metodo = todos.find(m => m.id === parseInt(formData.metodo_entrega_id));

    if (!metodo) {
      setCostoEnvio(0);
      return;
    }

    setCostoEnvio(parseFloat(metodo.costo) || 0);

  }, [formData.metodo_entrega_id, tiendasFisicas, puntosMedios, colonias]);

  // ─── HELPER: Obtener método seleccionado ──────────────────────
  const getMetodoSeleccionado = () => {
    const todos = [...tiendasFisicas, ...puntosMedios, ...colonias];
    return todos.find(m => m.id === parseInt(formData.metodo_entrega_id));
  };

  const metodoSeleccionado = getMetodoSeleccionado();

  const opcionesPorCategoria = {
    TIENDA: tiendasFisicas,
    PUNTO_MEDIO: puntosMedios,
    ENVIO_LOCAL: colonias
  };
  const opcionesActuales = opcionesPorCategoria[categoriaEntrega] || [];

  const categoriasDisponibles = CATEGORIAS_ENTREGA.filter(cat => {
    if (cat.key === 'TIENDA') return tiendasFisicas.length > 0;
    if (cat.key === 'PUNTO_MEDIO') return puntosMedios.length > 0;
    if (cat.key === 'ENVIO_LOCAL') return colonias.length > 0;
    return false;
  });

  const handleCategoriaChange = (key) => {
    setCategoriaEntrega(key);
    setFormData(prev => ({
      ...prev,
      metodo_entrega_id: '',
      direccion_envio: ''
    }));
    setError(null);
  };

  // ─── FORMATOS ──────────────────────────────────────────────────
  const formatPrice = (value) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(2);
  };

  const hasItems = Array.isArray(cartItems) && cartItems.length > 0;
  const safeCartTotal = parseFloat(cartTotal) || 0;
  const totalGeneral = safeCartTotal + costoEnvio;
  const montoAnticipo = totalGeneral * 0.5;
  const montoRestante = totalGeneral * 0.5;

  const metodoPagoSeleccionado = metodosPago.find(
    m => m.id === parseInt(formData.metodo_pago_id)
  );

  // ─── DETERMINAR TIPO DE ENTREGA ──────────────────────────────
  const esEnvioLocal = metodoSeleccionado?.tipo === 'ENVIO_LOCAL';
  const esPuntoMedio = metodoSeleccionado?.tipo === 'PUNTO_MEDIO';
  const esTiendaFisica = metodoSeleccionado?.tipo === 'RECOGIDA_FISICA';
  const requiereDireccion = esEnvioLocal;

  // ─── SUBMIT ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      if (!categoriaEntrega) {
        setError('Elige primero cómo quieres recibir tu pedido');
        setLoading(false);
        return;
      }

      if (!formData.metodo_entrega_id) {
        setError('Selecciona una opción de entrega');
        setLoading(false);
        return;
      }

      if (esEnvioLocal) {
        if (!formData.direccion_envio || formData.direccion_envio.trim() === '') {
          setError('La dirección de envío es requerida para envío a domicilio');
          setLoading(false);
          const direccionInput = document.getElementById('direccion-envio');
          if (direccionInput) {
            direccionInput.focus();
            direccionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        if (formData.direccion_envio.trim().length < 5) {
          setError('La dirección debe ser más específica (mínimo 5 caracteres)');
          setLoading(false);
          return;
        }
      }

      let direccionEnvio = formData.direccion_envio;

      if (esTiendaFisica || esPuntoMedio) {
        direccionEnvio = metodoSeleccionado?.descripcion || 'Dirección disponible en la confirmación del pedido';
      }

      const response = await axios.post(
        `${API_URL}/api/client/checkout/crear-pedido`,
        {
          metodo_entrega_id: parseInt(formData.metodo_entrega_id),
          metodo_pago_id: parseInt(formData.metodo_pago_id),
          direccion_envio: direccionEnvio,
          distancia_km: 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      refreshCart();
      navigate(`/cliente/pedido/${response.data.pedido_id}/pago`);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Cargando opciones de pago y entrega...</p>
      </div>
    );
  }

  if (!hasItems) {
    return (
      <div className="checkout-empty">
        <h2>Tu carrito está vacío</h2>
        <button onClick={() => navigate('/cliente/catalogo')}>Ver catálogo</button>
      </div>
    );
  }

  return (
    <div className="checkout-wrapper">
      <div className="checkout-header">
        <h2>Finalizar compra</h2>
        <p>Elige cómo recibir tu pedido y con qué método vas a pagar</p>
      </div>

      <div className="checkout-contenido">
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>

            {/* ─── PASO 1: CATEGORÍA DE ENTREGA ───────── */}
            <div className="form-group">
              <label htmlFor="categoria-entrega">
                <span className="form-step">1</span>
                ¿Cómo quieres recibir tu pedido?
              </label>
              <select
                id="categoria-entrega"
                value={categoriaEntrega}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                required
              >
                <option value="">Selecciona una opción</option>
                {categoriasDisponibles.map(cat => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ─── PASO 2: OPCIÓN ESPECÍFICA ──────────── */}
            {categoriaEntrega && (
              <div className="form-group">
                <label htmlFor="metodo-entrega">
                  <span className="form-step">2</span>
                  Selecciona una opción
                </label>
                {opcionesActuales.length === 0 ? (
                  <p className="entrega-sin-opciones">
                    No hay opciones disponibles para esta categoría por el momento.
                  </p>
                ) : (
                  <select
                    id="metodo-entrega"
                    value={formData.metodo_entrega_id}
                    onChange={(e) => setFormData({
                      ...formData,
                      metodo_entrega_id: e.target.value,
                      direccion_envio: ''
                    })}
                    required
                  >
                    <option value="">Selecciona un método</option>
                    {opcionesActuales.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} — {parseFloat(m.costo) === 0 ? 'Gratis' : `$${formatPrice(m.costo)}`}
                      </option>
                    ))}
                  </select>
                )}

                {metodoSeleccionado?.descripcion && (
                  <small className="entrega-option-desc">{metodoSeleccionado.descripcion}</small>
                )}
              </div>
            )}

            {/* ─── DIRECCIÓN (solo para ENVIO_LOCAL) ── */}
            {requiereDireccion && (
              <div className="form-group">
                <label>Dirección de envío</label>
                <textarea
                  id="direccion-envio"
                  value={formData.direccion_envio}
                  onChange={(e) => setFormData({ ...formData, direccion_envio: e.target.value })}
                  onBlur={(e) => {
                    if (esEnvioLocal && !e.target.value.trim()) {
                      setError('La dirección de envío es requerida');
                    } else if (esEnvioLocal && e.target.value.trim().length < 5) {
                      setError('La dirección debe ser más específica');
                    } else {
                      setError(null);
                    }
                  }}
                  placeholder="Calle, número, colonia, CP, ciudad"
                  required
                  rows="3"
                />
                <small>Ingresa la dirección completa donde deseas recibir tu pedido</small>
              </div>
            )}

            {/* ─── PUNTO MEDIO / TIENDA: información fija ── */}
            {(esPuntoMedio || esTiendaFisica) && metodoSeleccionado && (
              <div className="form-group direccion-fija">
                <label>{esPuntoMedio ? 'Punto de encuentro' : 'Dirección de recogida'}</label>
                <div className="direccion-fija-info">
                  <p className="direccion-fija-nombre">{metodoSeleccionado.nombre}</p>
                  {metodoSeleccionado.descripcion && (
                    <p className="direccion-descripcion">{metodoSeleccionado.descripcion}</p>
                  )}
                  <small className="direccion-hint">
                    {esPuntoMedio
                      ? 'Este es el punto de encuentro acordado.'
                      : 'Puedes recoger tu pedido en nuestra tienda.'}
                  </small>
                </div>
              </div>
            )}

            {/* ─── PASO 3: MÉTODO DE PAGO ── */}
            <div className="form-group">
              <label>
                <span className="form-step">3</span>
                Método de pago
              </label>
              <select
                value={formData.metodo_pago_id}
                onChange={(e) => setFormData({ ...formData, metodo_pago_id: e.target.value })}
                required
              >
                <option value="">Selecciona un método</option>
                {metodosPago.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.requiere_comprobante ? '(requiere comprobante)' : '(pago directo)'}
                  </option>
                ))}
              </select>

              {/* Solo una nota breve — las instrucciones y datos bancarios
                  completos se muestran hasta la pantalla de pago, después
                  de crear el pedido, para no repetir la misma información
                  dos veces. */}
              {metodoPagoSeleccionado && (
                <div className="metodo-pago-info">
                  {metodoPagoSeleccionado.descripcion && (
                    <p className="metodo-descripcion">{metodoPagoSeleccionado.descripcion}</p>
                  )}
                  <p className="metodo-pago-nota">
                    {metodoPagoSeleccionado.requiere_comprobante
                      ? 'Verás las instrucciones y datos de pago al confirmar tu pedido, en el siguiente paso.'
                      : 'Este método se liquida directamente; los detalles se muestran al confirmar tu pedido.'}
                  </p>
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-crear-pedido" disabled={loading}>
              {loading ? 'Creando pedido...' : 'Confirmar y crear pedido'}
            </button>
          </form>
        </div>

        {/* ─── RESUMEN ──────────────────────────────────────────── */}
        <div className="checkout-resumen">
          <h3>Resumen del pedido</h3>
          <div className="resumen-items">
            {Array.isArray(cartItems) && cartItems.map((item, index) => {
              const subtotal = parseFloat(item.subtotal) || parseFloat(item.precio_unitario) * parseFloat(item.cantidad) || 0;
              return (
                <div key={item.detalle_id || index} className="resumen-item">
                  <span>{item.producto_nombre} x{item.cantidad}</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
              );
            })}
          </div>
          <div className="resumen-totales">
            <div className="resumen-linea">
              <span>Subtotal productos</span>
              <span>${formatPrice(safeCartTotal)}</span>
            </div>
            <div className="resumen-linea">
              <span>Costo de envío</span>
              <span>${formatPrice(costoEnvio)}</span>
            </div>
            <div className="resumen-linea total">
              <span>Total</span>
              <span>${formatPrice(totalGeneral)}</span>
            </div>
            <div className="resumen-linea anticipo">
              <span>Anticipo (50%)</span>
              <span>${formatPrice(montoAnticipo)}</span>
            </div>
            <div className="resumen-linea restante">
              <span>Saldo restante (50%)</span>
              <span>${formatPrice(montoRestante)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;