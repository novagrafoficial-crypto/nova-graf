import { useEffect, useState } from 'react';
import './PwaStatus.css';

const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const esIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

/**
 * - Aviso "sin conexión" / "ya estás en línea"
 * - Botón "Instalar app" (Android/Chrome/Edge) o indicación para iOS
 * Se monta una sola vez en App.jsx
 */
export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [volvioOnline, setVolvioOnline] = useState(false);
  const [eventoInstalar, setEventoInstalar] = useState(null);
  const [instalada, setInstalada] = useState(yaInstalada());
  const [verTipIOS, setVerTipIOS] = useState(false);

  useEffect(() => {
    let timer;

    const alVolver = () => {
      setOnline(true);
      setVolvioOnline(true);
      timer = setTimeout(() => setVolvioOnline(false), 3500);
    };
    const alPerder = () => {
      clearTimeout(timer);
      setVolvioOnline(false);
      setOnline(false);
    };
    const alPoderInstalar = (e) => {
      e.preventDefault(); // guardamos el evento para lanzarlo con nuestro botón
      setEventoInstalar(e);
    };
    const alInstalar = () => {
      setInstalada(true);
      setEventoInstalar(null);
    };

    window.addEventListener('online', alVolver);
    window.addEventListener('offline', alPerder);
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', alInstalar);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', alVolver);
      window.removeEventListener('offline', alPerder);
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  const instalar = async () => {
    if (eventoInstalar) {
      eventoInstalar.prompt();
      await eventoInstalar.userChoice;
      setEventoInstalar(null);
    } else {
      setVerTipIOS((v) => !v);
    }
  };

  const mostrarBotonInstalar = !instalada && (eventoInstalar || esIOS());

  return (
    <>
      {!online && (
        <div className="pwa-banner offline" role="status">
          Sin conexión — mostrando el contenido guardado
        </div>
      )}
      {online && volvioOnline && (
        <div className="pwa-banner online" role="status">
          Conexión restablecida — ya estás en línea
        </div>
      )}

      {mostrarBotonInstalar && (
        <div className="pwa-install">
          {verTipIOS && (
            <div className="pwa-ios-tip">
              En Safari toca <strong>Compartir</strong> y luego <strong>“Agregar a inicio”</strong>.
            </div>
          )}
          <button onClick={instalar}>Instalar app</button>
        </div>
      )}
    </>
  );
}