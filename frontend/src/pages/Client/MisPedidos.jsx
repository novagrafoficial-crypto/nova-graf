// src/pages/Client/MisPedidos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/MisPedidos.css';

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
        
        console.log('📦 Pedidos recibidos:', res.data);
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
            <div key={pedido.id} className="pedido-card">
              {/* Header del pedido */}
              <div className="pedido-card-header">
                <span className="pedido-id">#{pedido.id}</span>
                <span className="pedido-fecha">
                  {new Date(pedido.fecha_pedido).toLocaleDateString()}
                </span>
                <span className={`pedido-estado estado-${pedido.estado}`}>
                  {pedido.estado}
                </span>
              </div>

              {/* Body del pedido */}
              <div className="pedido-card-body">
                <div className="pedido-info">
                  <span>Total: ${pedido.total_general}</span>
                  <span>Productos: {pedido.cantidad_productos || 0}</span>
                </div>
                <div className="pedido-info">
                  <span>Entrega: {pedido.metodo_entrega}</span>
                  <span>Anticipo: ${pedido.monto_anticipo}</span>
                </div>
              </div>

              {/* 🔹 ACCIONES */}
              <div className="pedido-card-actions">
                {/* Botón Ver detalle - Siempre visible */}
                <button 
                  className="btn-ver-detalle"
                  onClick={() => navigate(`/cliente/pedido/${pedido.id}`)}
                >
                  Ver detalle
                </button>

                {/* 🔹 BOTÓN SUBIR COMPROBANTE - Solo si está en WAITING_DEPOSIT_VERIFICATION */}
                {pedido.estado === 'WAITING_DEPOSIT_VERIFICATION' && (
                  <button 
                    className="btn-subir-comprobante"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago`)}
                  >
                    📎 Subir comprobante
                  </button>
                )}

                {/* 🔹 BOTÓN SUBIR DISEÑO - Solo si está en DESIGNING */}
                {pedido.estado === 'DESIGNING' && (
                  <button 
                    className="btn-subir-diseno"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/diseno`)}
                  >
                    🎨 Subir diseño
                  </button>
                )}

                {/* 🔹 BOTÓN PAGAR SALDO - Solo si está en PENDING_FINAL_PAYMENT */}
                {pedido.estado === 'PENDING_FINAL_PAYMENT' && (
                  <button 
                    className="btn-pagar-saldo"
                    onClick={() => navigate(`/cliente/pedido/${pedido.id}/pago-final`)}
                  >
                    💰 Pagar saldo restante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisPedidos;