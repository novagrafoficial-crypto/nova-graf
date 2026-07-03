// src/pages/Client/VerPrevias.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/VerPrevias.css';

const API_URL = import.meta.env.VITE_API_URL;

const VerPrevias = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [previas, setPrevias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

    useEffect(() => {
        const fetchPrevias = async () => {
            const token = getToken();
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/api/client/previas/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('🖼️ Previas cargadas:', res.data);
                console.log('🖼️ Array de previas:', res.data.previas);
                
                // ✅ Asegurar que previas sea un array
                setPrevias(Array.isArray(res.data.previas) ? res.data.previas : []);
            } catch (err) {
                console.error('Error al cargar previas:', err);
                setError('No se pudieron cargar las previas');
            } finally {
                setLoading(false);
            }
        };
        fetchPrevias();
    }, [id, navigate]);

    const aprobarPrevia = async (numeroPrevia) => {
        const token = getToken();
        try {
            await axios.post(
                `${API_URL}/api/client/previas/${id}/aprobar`,
                { numero_previa: numeroPrevia },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMensaje('✅ ¡Diseño aprobado! Redirigiendo...');
            setTimeout(() => {
                navigate(`/cliente/pedido/${id}`);
            }, 2000);
        } catch (err) {
            console.error('Error al aprobar previa:', err);
            setError('No se pudo aprobar la previa');
        }
    };

    const rechazarPrevia = async (numeroPrevia) => {
        const token = getToken();
        try {
            await axios.post(
                `${API_URL}/api/client/previas/${id}/rechazar`,
                { numero_previa: numeroPrevia },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Recargar previas
            const res = await axios.get(`${API_URL}/api/client/previas/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrevias(Array.isArray(res.data.previas) ? res.data.previas : []);
            setMensaje('Opción rechazada. El diseñador preparará una nueva opción.');
        } catch (err) {
            console.error('Error al rechazar previa:', err);
            setError('No se pudo rechazar la previa');
        }
    };

    if (loading) return <div className="previas-loading">Cargando previas...</div>;
    if (error) return <div className="previas-error">{error}</div>;

    // ✅ Verificar que previas sea un array y tenga elementos
    if (!Array.isArray(previas) || previas.length === 0) {
        return (
            <div className="previas-wrapper">
                <div className="previas-empty">
                    <div className="previas-empty-icon">🖼️</div>
                    <h2>No hay previas disponibles</h2>
                    <p>El administrador está preparando las opciones de diseño para tu pedido.</p>
                    <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
                        📋 Volver al pedido
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Verificar si hay previa aprobada
    const previaAprobada = previas.find(p => p.aprobada === true);
    if (previaAprobada) {
        return (
            <div className="previas-wrapper">
                <div className="previas-aprobada">
                    <div className="previas-aprobada-icon">✅</div>
                    <h2>¡Diseño aprobado!</h2>
                    <p>Has aprobado esta opción para tu pedido #{id}</p>
                    <div className="previas-aprobada-imagen">
                        <img src={previaAprobada.imagen_url} alt="Diseño aprobado" />
                    </div>
                    <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
                        📋 Ver detalle del pedido
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Buscar previa pendiente (no aprobada y no rechazada)
    const previaPendiente = previas.find(p => p.aprobada === false && p.rechazada !== true);
    const previasRechazadas = previas.filter(p => p.rechazada === true);

    // ✅ Si no hay previa pendiente y ya se rechazaron 2
    if (!previaPendiente && previasRechazadas.length >= 2) {
        return (
            <div className="previas-wrapper">
                <div className="previas-agotadas">
                    <div className="previas-agotadas-icon">😅</div>
                    <h2>Opciones agotadas</h2>
                    <p>Has rechazado ambas opciones de diseño.</p>
                    <p>Por favor, contacta al administrador para más opciones.</p>
                    <div className="previas-agotadas-botones">
                        <button className="btn-volver" onClick={() => navigate(`/cliente/pedido/${id}`)}>
                            📋 Volver al pedido
                        </button>
                        <button className="btn-chat" onClick={() => navigate(`/cliente/pedido/${id}`)}>
                            💬 Ir al chat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Si no hay previa pendiente pero hay rechazadas (menos de 2)
    if (!previaPendiente && previasRechazadas.length < 2) {
        return (
            <div className="previas-wrapper">
                <div className="previas-empty">
                    <div className="previas-empty-icon">⏳</div>
                    <h2>Esperando nueva opción</h2>
                    <p>El administrador está preparando una nueva opción de diseño.</p>
                    <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
                        📋 Volver al pedido
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Mostrar la previa pendiente (con verificación de seguridad)
    if (!previaPendiente) {
        return (
            <div className="previas-wrapper">
                <div className="previas-empty">
                    <div className="previas-empty-icon">🖼️</div>
                    <h2>No hay previas disponibles</h2>
                    <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
                        📋 Volver al pedido
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Mostrar la previa pendiente
    return (
        <div className="previas-wrapper">
            <div className="previas-header">
                <button className="btn-volver-simple" onClick={() => navigate(`/cliente/pedido/${id}`)}>
                    ← Volver al pedido
                </button>
                <h2>🖼️ Elige tu diseño favorito</h2>
                <p className="previas-subtitle">
                    {previasRechazadas.length === 0 
                        ? 'Esta es la primera opción de diseño. ¿Te gusta?'
                        : 'Segunda opción de diseño. ¿Te gusta esta?'}
                </p>
            </div>

            {mensaje && (
                <div className={`previas-mensaje ${mensaje.includes('✅') ? 'exito' : 'info'}`}>
                    {mensaje}
                </div>
            )}

            <div className="previas-contenido">
                <div className="previa-card">
                    <div className="previa-badges">
                        <span className="badge-opcion">Opción {previaPendiente.numero_previa} de 2</span>
                        {previasRechazadas.length > 0 && (
                            <span className="badge-rechazadas">
                                ❌ Rechazaste {previasRechazadas.length} opción(es)
                            </span>
                        )}
                    </div>

                    <div className="previa-imagen-container">
                        <img 
                            src={previaPendiente.imagen_url} 
                            alt={`Opción ${previaPendiente.numero_previa}`} 
                            className="previa-imagen"
                            onError={(e) => e.target.src = '/placeholder.png'}
                        />
                    </div>

                    <div className="previa-actions">
                        <button 
                            className="btn-aprobar"
                            onClick={() => aprobarPrevia(previaPendiente.numero_previa)}
                        >
                            ✅ Me gusta, elegir esta
                        </button>
                        <button 
                            className="btn-rechazar"
                            onClick={() => rechazarPrevia(previaPendiente.numero_previa)}
                        >
                            ❌ No me gusta, quiero otra
                        </button>
                    </div>

                    <div className="previa-ayuda">
                        <p>💡 Puedes usar el chat para dar detalles específicos sobre lo que quieres.</p>
                        <p>📝 Si rechazas esta opción, el diseñador preparará otra.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerPrevias;