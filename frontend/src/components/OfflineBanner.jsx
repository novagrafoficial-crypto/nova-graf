import { useEffect, useRef, useState } from 'react';
import '../styles/OfflineBanner.css';

/**
 * Aviso de conexión estilo PWA:
 *  - Sin internet  -> barra fija "Sin conexión" (se queda hasta que vuelva).
 *  - Al volver     -> "Conexión restablecida" durante 3 segundos.
 * Nota: el navegador sabe si el dispositivo tiene red, no si tu servidor responde.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [recuperada, setRecuperada] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const irOffline = () => {
      clearTimeout(timer.current);
      setRecuperada(false);
      setOnline(false);
    };
    const irOnline = () => {
      setOnline(true);
      setRecuperada(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRecuperada(false), 3000);
    };

    window.addEventListener('offline', irOffline);
    window.addEventListener('online', irOnline);
    return () => {
      window.removeEventListener('offline', irOffline);
      window.removeEventListener('online', irOnline);
      clearTimeout(timer.current);
    };
  }, []);

  if (online && !recuperada) return null;

  return (
    <div
      className={`offline-banner ${online ? 'offline-banner--ok' : 'offline-banner--off'}`}
      role="status"
      aria-live="polite"
    >
      <span className="offline-banner__dot" aria-hidden="true" />
      {online
        ? 'Conexión restablecida'
        : 'Sin conexión · Mostrando lo último que viste'}
    </div>
  );
}
