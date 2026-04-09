import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Definimos la URL base desde las variables de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCartCount = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCartCount(0);
      return;
    }
    setIsLoading(true);
    try {
      // ✅ Actualizada URL de conteo
      const res = await axios.get(`${API_URL}/api/client/carrito/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(res.data.count);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Sesión expirada');
        setCartCount(0);
      } else {
        console.error('Error al obtener conteo del carrito:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]); // Añadida dependencia API_URL

  const addToCart = async (productoPersonalizadoId, cantidad, precioUnitario) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    
    // ✅ Actualizada URL de añadir al carrito
    await axios.post(`${API_URL}/api/client/carrito`, {
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