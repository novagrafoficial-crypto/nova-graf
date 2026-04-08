import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCartCount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCartCount(0);
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/client/carrito/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(res.data.count);
    } catch (error) {
      if (error.response?.status === 401) {
        // Token inválido o expirado: limpiar estado y redirigir opcionalmente
        console.warn('Sesión expirada');
        setCartCount(0);
        // Opcional: redirigir al login
        // window.location.href = '/login';
      } else {
        console.error('Error al obtener conteo del carrito:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = async (productoPersonalizadoId, cantidad, precioUnitario) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    await axios.post('http://localhost:5000/api/client/carrito', {
      producto_personalizado_id: productoPersonalizadoId,
      cantidad,
      precio_unitario: precioUnitario
    }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchCartCount();
  };

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const value = {
    cartCount,
    addToCart,
    refreshCart: fetchCartCount,
    isLoading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};