// src/pages/Client/DetallePedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/DetallePedido.css';

const API_URL = import.meta.env.VITE_API_URL;

const DetallePedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        console.error(err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  if (loading) return <div className="detalle-loading">Cargando...</div>;
  if (error) return <div className="detalle-error">{error}</div>;
  if (!pedido) return <div className="detalle-error">Pedido no encontrado</div>;

  return (
    <div className="detalle-pedido-wrapper">
      <div className="detalle-pedido-header">
        <button onClick={() => navigate('/cliente/mis-pedidos')} className="btn-volver">
          ← Volver a mis pedidos
        </button>
        <h2>Pedido #{pedido.id}</h2>
        <span className={`estado-badge estado-${pedido.estado}`}>
          {pedido.estado}
        </span>
      </div>

      <div className="detalle-pedido-grid">
        <div className="detalle-info">
          <h3>Información del pedido</h3>
          <div className="info-linea">
            <span>Fecha:</span>
            <span>{new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
          </div>
          <div className="info-linea">
            <span>Método de entrega:</span>
            <span>{pedido.metodo_entrega_nombre}</span>
          </div>
          <div className="info-linea">
            <span>Dirección:</span>
            <span>{pedido.direccion_envio}</span>
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
        </div>

        <div className="detalle-productos">
          <h3>Productos</h3>
          {pedido.detalles?.map((detalle, index) => (
            <div key={index} className="producto-item">
              <img src={detalle.imagen_url || '/placeholder.png'} alt={detalle.producto_nombre} />
              <div className="producto-info">
                <h4>{detalle.producto_nombre}</h4>
                <p>Color: {detalle.color || 'N/A'}</p>
                <p>Cantidad: {detalle.cantidad}</p>
              </div>
              <div className="producto-precio">
                ${detalle.subtotal}
              </div>
            </div>
          ))}
          <div className="producto-total">
            <span>Total productos:</span>
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
    </div>
  );
};

export default DetallePedido;