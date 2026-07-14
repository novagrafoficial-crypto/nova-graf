// src/pages/Client/profile/MisDisenos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../../../utils/auth';
import '../../../styles/client/MisDisenos.css';

const API_URL = import.meta.env.VITE_API_URL;

const MisDisenos = () => {
    const navigate = useNavigate();
    const [disenos, setDisenos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDisenos = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/client/disenos`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Error al cargar diseños');

                const data = await res.json();
                setDisenos(data.disenos || []);
            } catch (err) {
                console.error('Error:', err);
                setError('No se pudieron cargar tus diseños');
            } finally {
                setLoading(false);
            }
        };

        fetchDisenos();
    }, []);

    if (loading) return <div className="md-loading">Cargando diseños...</div>;
    if (error) return <div className="md-error">{error}</div>;

    if (disenos.length === 0) {
        return (
            <div className="md-empty">
                <p>Aún no has enviado ningún diseño.</p>
                <button onClick={() => navigate('/cliente/catalogo')}>
                    Ver catálogo
                </button>
            </div>
        );
    }

    return (
        <div className="md-wrapper">
            <div className="md-header">
                <h2>🎨 Mis diseños</h2>
                <p>Todos los diseños que has enviado para personalización</p>
            </div>

            <div className="md-grid">
                {disenos.map((diseno) => (
                    <div key={diseno.id} className="md-card">
                        {/* ─── IMÁGENES ─── */}
                        <div className="md-card-images">
                            {/* Imagen de referencia (lo que subió el cliente) */}
                            <div className="md-image-container">
                                <div className="md-image-label">📎 Tu referencia</div>
                                {diseno.archivo_url ? (
                                    <img 
                                        src={diseno.archivo_url} 
                                        alt="Diseño de referencia" 
                                        className="md-image"
                                        onError={(e) => e.target.src = '/placeholder.png'}
                                    />
                                ) : (
                                    <div className="md-no-image">🎨</div>
                                )}
                            </div>

                            {/* Producto final (previas aprobadas) */}
                            {diseno.previas && diseno.previas.length > 0 && (
                                <div className="md-image-container">
                                    <div className="md-image-label">✅ Producto final</div>
                                    {diseno.previas.filter(p => p.aprobada).length > 0 ? (
                                        <img 
                                            src={diseno.previas.find(p => p.aprobada).imagen_url} 
                                            alt="Producto final" 
                                            className="md-image"
                                            onError={(e) => e.target.src = '/placeholder.png'}
                                        />
                                    ) : diseno.previas.length > 0 ? (
                                        <div className="md-previas-preview">
                                            {diseno.previas.map((previa, index) => (
                                                <img 
                                                    key={previa.id}
                                                    src={previa.imagen_url} 
                                                    alt={`Previa ${index + 1}`}
                                                    className="md-previa-thumb"
                                                    onError={(e) => e.target.src = '/placeholder.png'}
                                                />
                                            ))}
                                            <span className="md-previas-text">+ {diseno.previas.length} opciones</span>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* ─── ESTADO ─── */}
                        <span className={`md-status md-status-${diseno.pedido_estado}`}>
                            {diseno.pedido_estado === 'EN_REVISION' && '📋 En revisión'}
                            {diseno.pedido_estado === 'PREVIAS_ENVIADAS' && '🖼️ Previas listas'}
                            {diseno.pedido_estado === 'EN_PRODUCCION' && '🏭 En producción'}
                            {diseno.pedido_estado === 'ENVIADO' && '✅ Completado'}
                        </span>

                        <div className="md-card-body">
                            <h3>Pedido #{diseno.pedido_id}</h3>
                            <p className="md-descripcion">
                                {diseno.notas_cliente || 'Sin descripción'}
                            </p>
                            <div className="md-meta">
                                <span>📅 {new Date(diseno.fecha_envio).toLocaleDateString()}</span>
                                <span>🎨 {diseno.tipo_origen === 'ARCHIVO_SUBIDO' ? 'Archivo subido' : 'Editor'}</span>
                            </div>
                            <div className="md-previas-info">
                                <span>🖼️ Previas: {diseno.total_previas || 0}</span>
                                <span>✅ Aprobadas: {diseno.previas_aprobadas || 0}</span>
                            </div>
                            {diseno.previas_aprobadas > 0 && (
                                <div className="md-aprobada-badge">
                                    ✅ ¡Diseño aprobado!
                                </div>
                            )}
                        </div>

                        <div className="md-card-actions">
                            <button 
                                className="md-btn md-btn-primary"
                                onClick={() => navigate(`/cliente/pedido/${diseno.pedido_id}`)}
                            >
                                Ver pedido
                            </button>
                            {diseno.pedido_estado === 'PREVIAS_ENVIADAS' && (
                                <button 
                                    className="md-btn md-btn-secondary"
                                    onClick={() => navigate(`/cliente/pedido/${diseno.pedido_id}/previas`)}
                                >
                                    Ver previas
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MisDisenos;