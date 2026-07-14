// src/pages/Client/Personalizados.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/client/Personalizados.css';

const API_URL = import.meta.env.VITE_API_URL;

const Personalizados = () => {
    const navigate = useNavigate();
    const [portafolio, setPortafolio] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPortafolio = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/client/portafolio`);
                setPortafolio(res.data.portafolio || []);
                console.log('📦 Portafolio cargado:', res.data.portafolio);
            } catch (err) {
                console.error('Error al cargar portafolio:', err);
                setError('No se pudieron cargar los productos personalizados');
            } finally {
                setLoading(false);
            }
        };
        fetchPortafolio();
    }, []);

    if (loading) return <div className="personalizados-loading">Cargando productos personalizados...</div>;
    if (error) return <div className="personalizados-error">{error}</div>;

    return (
        <div className="personalizados-wrapper">
            <div className="personalizados-header">
                <h2>Productos personalizados</h2>
                <p>Explora nuestra galería de trabajos realizados</p>
            </div>

            {portafolio.length === 0 ? (
                <div className="personalizados-empty">
                    <span>🖼️</span>
                    <p>No hay productos personalizados publicados aún.</p>
                </div>
            ) : (
                <div className="personalizados-grid">
                    {portafolio.map((item) => (
                        <div 
                            key={item.id} 
                            className="personalizado-card"
                            onClick={() => {
                                if (item.producto_id) {
                                    navigate(`/cliente/producto/${item.producto_id}`);
                                }
                            }}
                        >
                            <div className="personalizado-imagen">
                                <img 
                                    src={item.imagen_url} 
                                    alt={item.descripcion || item.producto_nombre || 'Producto personalizado'}
                                    onError={(e) => e.target.src = '/placeholder.png'}
                                />
                                {item.producto_nombre && (
                                    <span className="personalizado-badge">{item.producto_nombre}</span>
                                )}
                            </div>
                            <div className="personalizado-info">
                                <h3>{item.descripcion || item.producto_nombre || 'Producto personalizado'}</h3>
                                {item.categoria_nombre && (
                                    <p className="personalizado-categoria">{item.categoria_nombre}</p>
                                )}
                                {item.precio_base && (
                                    <p className="personalizado-precio">Desde ${item.precio_base}</p>
                                )}
                                <button className="personalizado-btn">
                                    Ver producto →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Personalizados;