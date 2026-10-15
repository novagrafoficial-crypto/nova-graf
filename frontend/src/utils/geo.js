// ───────── GPS + cálculo de distancia ─────────
// Coordenadas de la tienda (ponlas en frontend/.env y en Vercel):
//   VITE_TIENDA_LAT=21.1426
//   VITE_TIENDA_LNG=-98.4219
export const TIENDA = {
  lat: parseFloat(import.meta.env.VITE_TIENDA_LAT),
  lng: parseFloat(import.meta.env.VITE_TIENDA_LNG),
};

// Ajusta estos límites a las reglas reales del negocio
export const REGLAS_ENTREGA = {
  tiendaMaxKm: 3,  // hasta 3 km: le conviene recoger en tienda
  envioMaxKm: 15,  // hasta 15 km: envío a domicilio; más lejos: punto medio
};

export function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu dispositivo no soporta geolocalización.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const mensajes = {
          1: 'Negaste el permiso de ubicación. Actívalo en los ajustes del navegador.',
          2: 'No se pudo determinar tu ubicación.',
          3: 'Se agotó el tiempo para obtener tu ubicación.',
        };
        reject(new Error(mensajes[err.code] || 'Error al obtener la ubicación.'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// Fórmula de Haversine (distancia en línea recta, en km)
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Devuelve la categoría de entrega que más le conviene, entre las disponibles
// keys: 'TIENDA' | 'ENVIO_LOCAL' | 'PUNTO_MEDIO'
export function sugerirEntrega(km, disponibles) {
  const { tiendaMaxKm, envioMaxKm } = REGLAS_ENTREGA;
  let orden;
  if (km <= tiendaMaxKm) orden = ['TIENDA', 'ENVIO_LOCAL', 'PUNTO_MEDIO'];
  else if (km <= envioMaxKm) orden = ['ENVIO_LOCAL', 'PUNTO_MEDIO', 'TIENDA'];
  else orden = ['PUNTO_MEDIO', 'ENVIO_LOCAL', 'TIENDA'];

  return orden.find((k) => disponibles.includes(k)) || null;
}