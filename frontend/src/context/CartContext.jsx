import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getToken } from '../utils/auth';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/client/carrito/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(res.data.count);
    } catch (error) {
      console.error('Error al obtener conteo:', error);
    }
  };

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

  useEffect(() => { fetchCartCount(); }, []);

  return (
    <CartContext.Provider value={{ cartCount, addToCart, refreshCart: fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};