// src/services/ofertaService.js
const API_BASE_URL = import.meta.env.VITE_API_URL;

export const ofertaService = {
  // Obtener todas las ofertas
  async getOfertas() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/client/ofertas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener ofertas');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getOfertas:', error);
      throw error;
    }
  },

  // Obtener detalle de una oferta
  async getOfertaDetalle(id) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/client/ofertas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener detalle de oferta');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getOfertaDetalle:', error);
      throw error;
    }
  },

  // Obtener ofertas para un producto
  // 👇 URL corregida para matchear backend/routes/client/ofertaRoutes.js
  //    (antes apuntaba a /api/client/productos/:id/ofertas, que no existe)
  async getOfertasByProducto(productoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/client/ofertas/producto/${productoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener ofertas del producto');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getOfertasByProducto:', error);
      throw error;
    }
  },

  // Formatear texto de descuento
  getDescuentoTexto(descuento) {
    if (!descuento) return '';
    const valor = typeof descuento.valor === 'string' ? parseFloat(descuento.valor) : descuento.valor;

    if (descuento.tipo === 'porcentaje') {
      return `${valor}% OFF`;
    } else if (descuento.tipo === 'fijo') {
      return `$${valor.toFixed(2)} OFF`;
    }
    return '';
  }
};