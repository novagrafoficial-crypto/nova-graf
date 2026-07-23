const axios = require('axios');

const ML_API = 'https://nova-graf-ml-api-wvzu.onrender.com';

const predecirCancelacion = async (datos) => {
  try {
    const res = await axios.post(`${ML_API}/predecir-cancelacion`, {
      edad: datos.edad || 30,
      total_pedidos: datos.total_pedidos || 0,
      tasa_cancelacion: datos.tasa_cancelacion || 0,
      metodo_pago: datos.metodo_pago || 1,
      metodo_entrega: datos.metodo_entrega || 1,
      es_nuevo: datos.es_nuevo || 1,
      cantidad_productos: datos.cantidad_productos || 1,
      dias_entrega: datos.dias_entrega || 7,
    });
    return res.data;
  } catch (err) {
    console.error('Error ML API:', err.message);
    return { cancelado: 0, riesgo: 'DESCONOCIDO' };
  }
};

module.exports = { predecirCancelacion };
