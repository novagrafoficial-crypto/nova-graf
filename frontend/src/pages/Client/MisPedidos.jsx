// src/pages/Client/MisPedidos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';

const API_URL = import.meta.env.VITE_API_URL;

const MisPedidos = () => {
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

      try {
        const res = await axios.get(`${API_URL}/api/client/pedidos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedidos(res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, [navigate]);

  if (loading) return <div className="mis-pedidos-loading">Cargando pedidos...</div>;
  if (error) return <div className="mis-pedidos-error">{error}</div>;

  return (
    <div className="mis-pedidos-wrapper">
      <div className="mis-pedidos-header">
        <h2>Mis pedidos</h2>
        <p>Revisa el estado de tus pedidos</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="mis-pedidos-empty">
          <p>No tienes pedidos aún</p>
          <button onClick={() => navigate('/cliente/catalogo')}>
            Ver catálogo
          </button>
        </div>
      ) : (
        <div className="mis-pedidos-grid">
          {pedidos.map(pedido => (
            <div 
              key={pedido.id} 
              className="pedido-card" 
              onClick={() => navigate(`/cliente/pedido/${pedido.id}`)}
            >
              <div className="pedido-card-header">
                <span className="pedido-id">#{pedido.id}</span>
                <span className={`pedido-estado estado-${pedido.estado}`}>
                  {pedido.estado}
                </span>
              </div>
              <div className="pedido-card-body">
                <div className="pedido-info">
                  <span>Fecha: {new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
                  <span>Total: ${pedido.total_general}</span>
                </div>
                <div className="pedido-info">
                  <span>Entrega: {pedido.metodo_entrega}</span>
                  <span>Productos: {pedido.cantidad_productos || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisPedidos; // ← Asegúrate de que esta línea existe