// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // ✅ OBTENER TODOS LOS DATOS DEL CARRITO
  const fetchCartData = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setCartCount(0);
      setCartItems([]);
      setCartTotal(0);
      return;
    }
    
    setIsLoading(true);
    try {
      // Obtener conteo
      const countRes = await axios.get(`${API_URL}/api/client/carrito/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Obtener items y total
      const itemsRes = await axios.get(`${API_URL}/api/client/carrito`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔄 CartContext - Respuesta del carrito:', itemsRes.data);

      // ✅ Extraer items y total
      const items = Array.isArray(itemsRes.data?.items) ? itemsRes.data.items : [];
      const total = itemsRes.data?.total || 0;
      
      setCartCount(countRes.data?.count || 0);
      setCartItems(items);
      setCartTotal(total);
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn('Sesión expirada');
        setCartCount(0);
        setCartItems([]);
        setCartTotal(0);
      } else {
        console.error('Error al obtener datos del carrito:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  // ✅ REFRESH (alias de fetchCartData)
  const refreshCart = useCallback(async () => {
    await fetchCartData();
  }, [fetchCartData]);

  // ✅ AGREGAR AL CARRITO
  const addToCart = async (varianteId, cantidad) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    
    try {
      await axios.post(`${API_URL}/api/client/carrito`, {
        variante_id: varianteId,
        cantidad
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await refreshCart();
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      throw error;
    }
  };

  // ✅ ACTUALIZAR CANTIDAD
  const updateQuantity = async (detalleId, cantidad) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    
    try {
      await axios.put(`${API_URL}/api/client/carrito/${detalleId}`, {
        cantidad
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await refreshCart();
    } catch (error) {
      console.error('Error al actualizar cantidad:', error);
      throw error;
    }
  };

  // ✅ ELIMINAR DEL CARRITO
  const removeFromCart = async (detalleId) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    
    try {
      await axios.delete(`${API_URL}/api/client/carrito/${detalleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await refreshCart();
    } catch (error) {
      console.error('Error al eliminar del carrito:', error);
      throw error;
    }
  };

  // ✅ VACIAR CARRITO
  const clearCart = async () => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    
    try {
      await axios.delete(`${API_URL}/api/client/carrito`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await refreshCart();
    } catch (error) {
      console.error('Error al vaciar el carrito:', error);
      throw error;
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);

  const value = {
    cartCount,
    cartItems,
    cartTotal,
    isLoading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};