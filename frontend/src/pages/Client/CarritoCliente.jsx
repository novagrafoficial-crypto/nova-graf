import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { useCart } from '../../context/CartContext';
import '../../styles/client/Carrito.css';

// ✅ URL dinámica con fallback para desarrollo local
const API_BASE = import.meta.env.VITE_API_URL;


const CarritoCliente = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshCart } = useCart();

  const fetchCarrito = async () => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      // ✅ Usar API_BASE
      const res = await axios.get(`${API_BASE}/api/client/carrito`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(res.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarrito();
  }, []);

  const handleActualizarCantidad = async (carritoId, cantidad) => {
    if (cantidad < 1) return;
    const token = getToken();
    try {
      // ✅ Usar API_BASE
      await axios.put(`${API_BASE}/api/client/carrito/${carritoId}`, 
        { cantidad }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCarrito();
      refreshCart();
    } catch (err) {
      alert('Error al actualizar cantidad');
    }
  };

  const handleEliminar = async (carritoId) => {
    if (!window.confirm('¿Eliminar este producto del carrito?')) return;
    const token = getToken();
    try {
      // ✅ Usar API_BASE
      await axios.delete(`${API_BASE}/api/client/carrito/${carritoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchCarrito();
      refreshCart();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const calcularTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.precio_total || 0), 0);
  };

  if (loading) return <div className="carrito-loading">Cargando carrito...</div>;
  if (error) return <div className="carrito-error">{error}</div>;

  return (
    <div className="carrito-page">
      <h1>🛒 Mi carrito</h1>
      {items.length === 0 ? (
        <div className="carrito-empty">
          <p>Tu carrito está vacío</p>
          <button onClick={() => navigate('/cliente/catalogo')}>Ver catálogo</button>
        </div>
      ) : (
        <div className="carrito-container">
          <div className="carrito-items">
            {items.map(item => (
              <div key={item.carrito_id} className="carrito-item">
                <div className="carrito-item__img">
                  <img 
                    src={item.imagen_personalizada_url || item.variante_imagen} 
                    alt={item.producto_nombre} 
                  />
                </div>
                <div className="carrito-item__info">
                  <h3>{item.producto_nombre}</h3>
                  <p>Color: {item.color || 'N/A'}</p>
                  {item.texto_personalizado && <p>Texto: {item.texto_personalizado}</p>}
                  <p className="carrito-item__price">
                    Precio unitario: ${parseFloat(item.precio_unitario).toFixed(2)}
                  </p>
                </div>
                <div className="carrito-item__actions">
                  <div className="cantidad-control">
                    <button 
                      onClick={() => handleActualizarCantidad(item.carrito_id, item.cantidad - 1)}
                      disabled={item.cantidad <= 1}
                    >
                      −
                    </button>
                    <span>{item.cantidad}</span>
                    <button 
                      onClick={() => handleActualizarCantidad(item.carrito_id, item.cantidad + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="carrito-item__subtotal">
                    Subtotal: ${parseFloat(item.precio_total).toFixed(2)}
                  </p>
                  <button 
                    className="btn-eliminar" 
                    onClick={() => handleEliminar(item.carrito_id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="carrito-resumen">
            <h2>Resumen</h2>
            <p>Total: <strong>${calcularTotal().toFixed(2)}</strong></p>
            <button className="btn-checkout" onClick={() => navigate('/cliente/checkout')}>
              Proceder al pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoCliente;