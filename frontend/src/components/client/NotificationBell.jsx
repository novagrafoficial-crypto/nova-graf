// src/components/client/NotificationBell.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import '../../styles/client/NotificationBell.css';

const NotificationBell = () => {
    const navigate = useNavigate();
    const { notificaciones, noLeidas, marcarComoLeida, marcarTodasComoLeidas, eliminarNotificacion } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificacionClick = (notificacion) => {
        marcarComoLeida(notificacion.id);
        if (notificacion.enlace) {
            navigate(notificacion.enlace);
        }
        setIsOpen(false);
    };

    const getIcono = (tipo) => {
        const iconos = {
            'ESTADO_CAMBIADO': '🔄',
            'PAGO_APROBADO': '✅',
            'PAGO_RECHAZADO': '❌',
            'PREVIA_ENVIADA': '🖼️',
            'MENSAJE_NUEVO': '💬'
        };
        return iconos[tipo] || '📢';
    };

    const getColor = (tipo) => {
        const colores = {
            'ESTADO_CAMBIADO': '#3b82f6',
            'PAGO_APROBADO': '#16a34a',
            'PAGO_RECHAZADO': '#dc2626',
            'PREVIA_ENVIADA': '#8b5cf6',
            'MENSAJE_NUEVO': '#f59e0b'
        };
        return colores[tipo] || '#6b7280';
    };

    return (
        <div className="nb-wrapper" ref={dropdownRef}>
            <button 
                className={`nb-bell ${isOpen ? 'nb-bell--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notificaciones"
            >
                <span className="nb-bell-icon">🔔</span>
                {noLeidas > 0 && (
                    <span className="nb-bell-badge">{noLeidas > 99 ? '99+' : noLeidas}</span>
                )}
            </button>

            {isOpen && (
                <div className="nb-dropdown">
                    <div className="nb-header">
                        <span className="nb-title">Notificaciones</span>
                        {noLeidas > 0 && (
                            <button 
                                className="nb-btn-mark-all"
                                onClick={marcarTodasComoLeidas}
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="nb-list">
                        {notificaciones.length === 0 ? (
                            <div className="nb-empty">
                                <span>📭</span>
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            notificaciones.slice(0, 20).map(notificacion => (
                                <div 
                                    key={notificacion.id} 
                                    className={`nb-item ${!notificacion.leida ? 'nb-item--no-leida' : ''}`}
                                    onClick={() => handleNotificacionClick(notificacion)}
                                >
                                    <div className="nb-item-icon" style={{ background: getColor(notificacion.tipo) }}>
                                        {getIcono(notificacion.tipo)}
                                    </div>
                                    <div className="nb-item-content">
                                        <div className="nb-item-title">{notificacion.titulo}</div>
                                        <div className="nb-item-message">{notificacion.mensaje}</div>
                                        <div className="nb-item-time">
                                            {new Date(notificacion.creado_en).toLocaleString('es-MX')}
                                        </div>
                                    </div>
                                    <button 
                                        className="nb-item-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarNotificacion(notificacion.id);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {notificaciones.length > 20 && (
                        <div className="nb-footer">
                            <button 
                                className="nb-btn-ver-todas"
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/cliente/notificaciones');
                                }}
                            >
                                Ver todas las notificaciones
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;