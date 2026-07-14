// src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

const API_URL = import.meta.env.VITE_API_URL;

export const NotificationProvider = ({ children }) => {
    const [notificaciones, setNotificaciones] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotificaciones = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setNotificaciones([]);
            setNoLeidas(0);
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(`${API_URL}/api/client/notificaciones`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setNotificaciones(res.data.notificaciones || []);
            setNoLeidas(res.data.noLeidas || 0);
        } catch (err) {
            console.error('Error al obtener notificaciones:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const marcarComoLeida = useCallback(async (id) => {
        const token = getToken();
        if (!token) return;

        try {
            await axios.put(
                `${API_URL}/api/client/notificaciones/${id}/leer`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setNotificaciones(prev => 
                prev.map(n => n.id === id ? { ...n, leida: true } : n)
            );
            setNoLeidas(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error al marcar como leída:', err);
        }
    }, []);

    const marcarTodasComoLeidas = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            await axios.put(
                `${API_URL}/api/client/notificaciones/leer-todas`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setNotificaciones(prev => 
                prev.map(n => ({ ...n, leida: true }))
            );
            setNoLeidas(0);
        } catch (err) {
            console.error('Error al marcar todas como leídas:', err);
        }
    }, []);

    const eliminarNotificacion = useCallback(async (id) => {
        const token = getToken();
        if (!token) return;

        try {
            await axios.delete(
                `${API_URL}/api/client/notificaciones/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const notificacionEliminada = notificaciones.find(n => n.id === id);
            setNotificaciones(prev => prev.filter(n => n.id !== id));
            if (notificacionEliminada && !notificacionEliminada.leida) {
                setNoLeidas(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error al eliminar notificación:', err);
        }
    }, [notificaciones]);

    // Polling cada 30 segundos
    useEffect(() => {
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 30000);
        return () => clearInterval(interval);
    }, [fetchNotificaciones]);

    const value = {
        notificaciones,
        noLeidas,
        loading,
        fetchNotificaciones,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};