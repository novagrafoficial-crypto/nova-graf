// src/pages/Client/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import '../../styles/client/Checkout.css';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ Normaliza el campo datos_bancarios venga como venga de la BD:
//    - objeto plano { banco: "...", clabe: "..." }
//    - string JSON: '{"banco":"...","clabe":"..."}'
//    - array con un objeto adentro: [{ banco: "...", clabe: "..." }]
//    - array con un string JSON adentro: ['{"banco":"...","clabe":"..."}']
const normalizarDatosBancarios = (data) => {
  if (!data) return null;

  let valor = data;

  // Si viene como string, intentar parsear a JSON
  if (typeof valor === 'string') {
    try {
      valor = JSON.parse(valor);
    } catch {
      return null;
    }
  }

  // Si viene como array, tomar el primer elemento
  if (Array.isArray(valor)) {
    valor = valor[0];
    if (typeof valor === 'string') {
      try {
        valor = JSON.parse(valor);
      } catch {
        return null;
      }
    }
  }

  if (!valor || typeof valor !== 'object') return null;
  return valor;
};

// ✅ Convierte "numero_cuenta" -> "Número cuenta" para mostrarlo bonito
const formatearEtiqueta = (clave) => {
  const especiales = {
    clabe: 'CLABE',
    rfc: 'RFC',
  };
  if (especiales[clave.toLowerCase()]) return especiales[clave.toLowerCase()];
  return clave
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems = [], cartTotal = 0, refreshCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [metodosEntrega, setMetodosEntrega] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [formData, setFormData] = useState({
    metodo_entrega_id: '',
    metodo_pago_id: '',
    direccion_envio: '',
    distancia_km: 0
  });
  const [error, setError] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);

  // Cargar métodos de entrega y pago
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const [entregaRes, pagoRes] = await Promise.all([
          axios.get(`${API_URL}/api/client/checkout/metodos-entrega`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/client/checkout/metodos-pago`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setMetodosEntrega(entregaRes.data || []);
        setMetodosPago(pagoRes.data || []);
      } catch (err) {
        console.error(err);
        setError('Error al cargar métodos');
      }
    };
    fetchData();
  }, [navigate]);

  // Calcular costo de envío
  useEffect(() => {
    const metodo = metodosEntrega.find(m => m.id === parseInt(formData.metodo_entrega_id));
    if (!metodo) {
      setCostoEnvio(0);
      return;
    }

    if (metodo.es_dinamico_km && formData.distancia_km > 0) {
      const costo = formData.distancia_km * metodo.costo_por_km;
      setCostoEnvio(Math.max(costo, metodo.costo_minimo));
    } else {
      setCostoEnvio(parseFloat(metodo.costo) || 0);
    }
  }, [formData.metodo_entrega_id, formData.distancia_km, metodosEntrega]);

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
  const datosBancarios = normalizarDatosBancarios(metodoPagoSeleccionado?.datos_bancarios);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/api/client/checkout/crear-pedido`,
        {
          metodo_entrega_id: parseInt(formData.metodo_entrega_id),
          metodo_pago_id: parseInt(formData.metodo_pago_id),
          direccion_envio: formData.direccion_envio,
          distancia_km: formData.distancia_km || 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      refreshCart();
      navigate(`/cliente/pedido/${response.data.pedido_id}/pago`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al crear el pedido');
    } finally {
      setLoading(false);
    }
  };

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
        <h2>Checkout</h2>
        <p>Revisa tu pedido y elige método de entrega y pago</p>
      </div>

      <div className="checkout-contenido">
        <div className="checkout-form">
          <form onSubmit={handleSubmit}>
            {/* Método de entrega */}
            <div className="form-group">
              <label>Método de entrega *</label>
              <select
                value={formData.metodo_entrega_id}
                onChange={(e) => setFormData({ ...formData, metodo_entrega_id: e.target.value })}
                required
              >
                <option value="">Selecciona un método</option>
                {metodosEntrega.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} - {m.es_dinamico_km ? 'Por Km' : `$${formatPrice(m.costo)}`}
                  </option>
                ))}
              </select>
              {formData.metodo_entrega_id && (
                <small className="metodo-descripcion">
                  {metodosEntrega.find(m => m.id === parseInt(formData.metodo_entrega_id))?.descripcion}
                </small>
              )}
            </div>

            {/* Método de pago */}
            <div className="form-group">
              <label>Método de pago *</label>
              <select
                value={formData.metodo_pago_id}
                onChange={(e) => setFormData({ ...formData, metodo_pago_id: e.target.value })}
                required
              >
                <option value="">Selecciona un método</option>
                {metodosPago.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} {m.requiere_comprobante ? '📎 (requiere comprobante)' : '✅ (pago directo)'}
                  </option>
                ))}
              </select>

              {metodoPagoSeleccionado && (
                <div className="metodo-pago-info">
                  {metodoPagoSeleccionado.descripcion && (
                    <small className="metodo-descripcion">
                      {metodoPagoSeleccionado.descripcion}
                    </small>
                  )}

                  {metodoPagoSeleccionado.instrucciones && (
                    <div className="instrucciones-pago">
                      <strong>📌 Instrucciones</strong>
                      <p>{metodoPagoSeleccionado.instrucciones}</p>
                    </div>
                  )}

                  {/* ✅ Datos bancarios formateados (ya no JSON crudo) */}
                  {metodoPagoSeleccionado.datos_bancarios && (
                    <div className="datos-bancarios">
                      <strong>🏦 Datos bancarios</strong>
                      {datosBancarios ? (
                        <div className="datos-bancarios-lista">
                          {Object.entries(datosBancarios).map(([clave, valor]) => (
                            <div className="datos-bancarios-fila" key={clave}>
                              <span>{formatearEtiqueta(clave)}</span>
                              <span>{String(valor)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="datos-bancarios-vacio">
                          No se pudieron leer los datos bancarios de este método.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="form-group">
              <label>Dirección de envío *</label>
              <textarea
                value={formData.direccion_envio}
                onChange={(e) => setFormData({ ...formData, direccion_envio: e.target.value })}
                placeholder="Calle, número, colonia, CP, ciudad"
                required
                rows="3"
              />
            </div>

            {/* Distancia (si aplica) */}
            {formData.metodo_entrega_id && 
             metodosEntrega.find(m => m.id === parseInt(formData.metodo_entrega_id))?.es_dinamico_km && (
              <div className="form-group">
                <label>Distancia en Km</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.distancia_km}
                  onChange={(e) => setFormData({ ...formData, distancia_km: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 5.5"
                />
                <small>La distancia se calculará automáticamente con Google Maps</small>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-crear-pedido" disabled={loading}>
              {loading ? 'Creando pedido...' : 'Crear pedido'}
            </button>
          </form>
        </div>

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
              <span>💰 Anticipo (50%)</span>
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