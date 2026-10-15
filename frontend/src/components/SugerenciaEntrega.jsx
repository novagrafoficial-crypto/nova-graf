import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { TIENDA, obtenerUbicacion, distanciaKm, sugerirEntrega } from '../utils/geo';

const MOTIVOS = {
  TIENDA: 'Estás cerca de la tienda, puedes recoger tu pedido sin costo de envío.',
  ENVIO_LOCAL: 'Estás dentro de la zona de entrega, te lo llevamos a domicilio.',
  PUNTO_MEDIO: 'Estás algo lejos, te conviene un punto de encuentro intermedio.',
};

/**
 * Props:
 *  - categoriasDisponibles: [{ key, label }]  (las que ya calcula Checkout.jsx)
 *  - onSugerir(key): selecciona la categoría (usa handleCategoriaChange del Checkout)
 */
export default function SugerenciaEntrega({ categoriasDisponibles, onSugerir }) {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const calcular = async () => {
    setError(null);
    setResultado(null);

    if (Number.isNaN(TIENDA.lat) || Number.isNaN(TIENDA.lng)) {
      setError('Falta configurar VITE_TIENDA_LAT y VITE_TIENDA_LNG.');
      return;
    }

    setCargando(true);
    try {
      const { lat, lng } = await obtenerUbicacion();
      const km = distanciaKm(lat, lng, TIENDA.lat, TIENDA.lng);
      const key = sugerirEntrega(km, categoriasDisponibles.map((c) => c.key));

      if (!key) {
        setError('No hay opciones de entrega disponibles.');
        return;
      }
      setResultado({ km, key, label: categoriasDisponibles.find((c) => c.key === key)?.label });
      onSugerir(key);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 16 }}>
      <button
        type="button"
        onClick={calcular}
        disabled={cargando}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 8, border: '1px solid #1A6163',
          background: '#fff', color: '#1A6163', fontWeight: 600, cursor: 'pointer',
        }}
      >
        <MapPin size={16} />
        {cargando ? 'Obteniendo ubicación…' : 'Sugerir entrega según mi ubicación'}
      </button>

      {resultado && (
        <small style={{ display: 'block', marginTop: 8 }}>
          Estás a <strong>{resultado.km.toFixed(1)} km</strong> de la tienda. Opción sugerida:{' '}
          <strong>{resultado.label}</strong>. {MOTIVOS[resultado.key]}
        </small>
      )}
      {error && (
        <small style={{ display: 'block', marginTop: 8, color: '#b91c1c' }}>{error}</small>
      )}
    </div>
  );
}