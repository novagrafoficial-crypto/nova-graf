// frontend/src/pages/client/PedidosCliente.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../utils/auth';
import '../../styles/client/PedidosCliente.css';

const API_URL = import.meta.env.VITE_API_URL;

const PedidosCliente = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Asegurar que los precios sean números
        const pedidosNormalizados = pedidosSimulados.map(pedido => ({
          ...pedido,
          total: Number(pedido.total) || 0,
          items: pedido.items.map(item => ({
            ...item,
            precio_unitario: Number(item.precio_unitario) || 0,
          }))
        }));
        // Ordenar por fecha descendente
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
    <div className="pedidos-container">
      <h1>Mis compras</h1>
      {pedidos.length === 0 ? (
        <div className="pedidos-empty">
          <p>No has realizado ninguna compra aún.</p>
          <button onClick={() => navigate('/cliente/catalogo')}>Ir al catálogo</button>
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
  );
};

export default PedidosCliente;