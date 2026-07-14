// src/pages/Client/PagoFinal.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { supabase } from '../../lib/supabase';
import '../../styles/client/PagoFinal.css';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ Normaliza el campo datos_bancarios
const normalizarDatosExtra = (data) => {
  if (!data) return null;
  let valor = data;
  if (typeof valor === 'string') {
    try { valor = JSON.parse(valor); } catch { return null; }
  }
  if (Array.isArray(valor)) {
    valor = valor[0];
    if (typeof valor === 'string') {
      try { valor = JSON.parse(valor); } catch { return null; }
    }
  }
  if (!valor || typeof valor !== 'object') return null;
  return valor;
};

const formatearEtiqueta = (clave) => {
  const especiales = { clabe: 'CLABE', rfc: 'RFC' };
  if (especiales[clave.toLowerCase()]) return especiales[clave.toLowerCase()];
  return clave.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const copiarDato = (valor, setCopiado) => {
  navigator.clipboard.writeText(String(valor));
  setCopiado(valor);
  setTimeout(() => setCopiado(null), 1500);
};

function PagoFinal() {  // ← CAMBIAR de export default function a function
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [montoPendiente, setMontoPendiente] = useState(0);
  const [metodoPago, setMetodoPago] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);
  const [notas, setNotas] = useState('');
  const [exito, setExito] = useState(false);
  const [copiado, setCopiado] = useState(null);
  const [comprobanteUrlGuardado, setComprobanteUrlGuardado] = useState(null);
  const [user, setUser] = useState(null);

  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(null);

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);

        const pedidoRes = await axios.get(`${API_URL}/api/client/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedido(pedidoRes.data);

        const totalPagado = pedidoRes.data.pagos?.reduce((acc, p) => {
          if (p.estado_pago === 'APROBADO') {
            return acc + parseFloat(p.monto);
          }
          return acc;
        }, 0) || 0;

        const pendiente = parseFloat(pedidoRes.data.total_general) - totalPagado;
        setMontoPendiente(pendiente > 0 ? pendiente : 0);

        const pagoRes = await axios.get(`${API_URL}/api/client/checkout/metodos-pago`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMetodosPago(pagoRes.data || []);

        if (pedidoRes.data.metodo_pago_id) {
          const metodo = pagoRes.data.find(m => m.id === pedidoRes.data.metodo_pago_id);
          if (metodo) {
            setMetodoPagoSeleccionado(metodo);
            setMetodoPago(metodo.nombre?.toLowerCase() || '');
          }
        } else if (pagoRes.data.length > 0) {
          setMetodoPagoSeleccionado(pagoRes.data[0]);
          setMetodoPago(pagoRes.data[0].nombre?.toLowerCase() || '');
        }

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err.response?.data?.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (metodosPago.length > 0 && metodoPago) {
      const encontrado = metodosPago.find(m =>
        m.nombre?.toLowerCase() === metodoPago.toLowerCase()
      );
      setMetodoPagoSeleccionado(encontrado || null);
    }
  }, [metodoPago, metodosPago]);

  // ✅ Si es pago en tienda, limpiar comprobante
  useEffect(() => {
    if (metodoPagoSeleccionado && !metodoPagoSeleccionado.requiere_comprobante) {
      setComprobante(null);
      setComprobantePreview(null);
      setError(null);
    }
  }, [metodoPagoSeleccionado]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo no debe superar los 5MB');
        return;
      }

      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(file.type)) {
        setError('Solo se permiten archivos JPG, PNG o PDF');
        return;
      }

      setError(null);
      setComprobante(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setComprobantePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setComprobantePreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setComprobante(null);
    if (comprobantePreview) {
      URL.revokeObjectURL(comprobantePreview);
    }
    setComprobantePreview(null);
    const fileInput = document.getElementById('comprobante');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const subirArchivoSupabase = async (file, usuarioId, pedidoData, clienteData, tipo = 'PAGO_FINAL') => {
    const clienteNombre = (clienteData?.nombre || 'cliente')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const pedidoId = pedidoData?.id || id;
    const fechaStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();

    const fileName = `${tipo}_Pedido_${pedidoId}_Cliente_${clienteNombre}_${fechaStr}_${timestamp}.${extension}`;
    const filePath = `pagos/usuario_${usuarioId}/${fileName}`;

    console.log(`📤 Subiendo ${tipo}: ${filePath}`);

    const { error } = await supabase.storage
      .from('borradores')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('borradores')
      .getPublicUrl(filePath);

    console.log(`✅ ${tipo} subido: ${publicUrl}`);
    return publicUrl;
  };

  const handleDescargarComprobante = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const clienteNombre = (user?.nombre || 'cliente')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      const pedidoId = pedido?.id || id;
      const fechaStr = new Date().toISOString().split('T')[0];
      const extension = url.split('.').pop() || 'jpg';

      const nombreDescarga = `PAGO_FINAL_Pedido_${pedidoId}_Cliente_${clienteNombre}_${fechaStr}.${extension}`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = nombreDescarga;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      setError('No se pudo descargar el comprobante');
    }
  };

  // ✅ HANDLE SUBMIT - SIN referencia
  const handleSubmit = async (e) => {
    e.preventDefault();

    const esPagoTienda = metodoPagoSeleccionado?.requiere_comprobante === false;

    // ✅ Validación para pago con comprobante
    if (!esPagoTienda && !comprobante) {
      setError('Debes subir el comprobante de pago');
      return;
    }

    setSubiendo(true);
    setError(null);

    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      let comprobanteUrl = null;

      if (comprobante) {
        comprobanteUrl = await subirArchivoSupabase(
          comprobante,
          userData.id_usuario,
          pedido,
          userData,
          'PAGO_FINAL'
        );
        setComprobanteUrlGuardado(comprobanteUrl);
      }

      // ✅ Payload SIN referencia
      const payload = {
        monto: montoPendiente,
        tipo_pago: 'SALDO_FINAL',
        comprobante_url: comprobanteUrl || 'TIENDA_FISICA',
        notas_admin: notas.trim() || null
      };

      console.log('📤 Enviando pago final:', payload);

      await axios.post(
        `${API_URL}/api/client/pedidos/${id}/pago-final`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setExito(true);

      setTimeout(() => {
        navigate(`/cliente/pedido/${id}`);
      }, 5000);

    } catch (err) {
      console.error('❌ Error en pago final:', err);
      setError(err.response?.data?.message || 'Error al procesar el pago. Intenta nuevamente.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargarTicket = () => {
    window.print();
  };

  // ─── RENDER ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="pf-spinner"></div>
        <p>Cargando información del pedido...</p>
      </div>
    );
  }

  if (error && !pedido) {
    return (
      <div className="pf-status pf-status--error">
        <span className="pf-status-icon">✕</span>
        <h2>Ocurrió un error</h2>
        <p>{error}</p>
        <button className="pf-btn pf-btn--ghost" onClick={() => navigate(`/cliente/pedido/${id}`)}>
          Volver al pedido
        </button>
      </div>
    );
  }

  if (montoPendiente === 0) {
    return (
      <div className="pf-status pf-status--success">
        <span className="pf-status-icon">✓</span>
        <h2>Pedido completamente pagado</h2>
        <p>No tienes saldo pendiente. Tu pedido está al día.</p>
        <button className="pf-btn pf-btn--primary" onClick={() => navigate(`/cliente/pedido/${id}`)}>
          Volver al pedido
        </button>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="pf-status pf-status--success">
        <span className="pf-status-icon">✓</span>
        <h2>{comprobanteUrlGuardado ? 'Comprobante enviado' : 'Pago en tienda registrado'}</h2>
        <p>
          {comprobanteUrlGuardado 
            ? 'Estamos verificando tu pago. En breve recibirás una notificación.'
            : 'Tu pago en tienda ha sido registrado. El administrador confirmará tu pago pronto.'}
        </p>
        <div className="pf-success-monto">${montoPendiente.toFixed(2)} MXN</div>

        {comprobanteUrlGuardado && (
          <div className="pf-success-actions">
            <button
              className="pf-btn pf-btn--outline"
              onClick={() => handleDescargarComprobante(comprobanteUrlGuardado)}
            >
              📎 Descargar comprobante
            </button>
          </div>
        )}

        <button
          className="pf-btn pf-btn--primary"
          onClick={() => navigate(`/cliente/pedido/${id}`)}
          style={{ marginTop: 8 }}
        >
          Ver pedido
        </button>
      </div>
    );
  }

  const requiereComprobante = metodoPagoSeleccionado?.requiere_comprobante !== false;
  const esPagoTienda = !requiereComprobante;
  const datosExtra = normalizarDatosExtra(metodoPagoSeleccionado?.datos_bancarios);
  const folio = `NG-${String(id).padStart(5, '0')}`;

  return (
    <div className="pf-page">
      <div className="pf-card">

        <div className="pf-header pf-noprint">
          <button className="pf-back" onClick={() => navigate(`/cliente/pedido/${id}`)}>
            ← Volver
          </button>
          <span className="pf-eyebrow">Pedido #{id}</span>
          <h1>{esPagoTienda ? 'Pago en tienda' : 'Completar pago'}</h1>
        </div>

        <div className="pf-resumen pf-noprint">
          <div className="pf-resumen-fila">
            <span>Total del pedido</span>
            <span>${parseFloat(pedido.total_general).toFixed(2)}</span>
          </div>
          <div className="pf-resumen-fila">
            <span>Ya pagado</span>
            <span>${(parseFloat(pedido.total_general) - montoPendiente).toFixed(2)}</span>
          </div>
          <div className="pf-resumen-fila pf-resumen-fila--total">
            <span>Saldo por pagar</span>
            <span>${montoPendiente.toFixed(2)}</span>
          </div>
        </div>

        {metodosPago.length > 1 && (
          <div className="pf-group pf-noprint">
            <label htmlFor="metodo">Método de pago</label>
            <select
              id="metodo"
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="pf-select"
            >
              {metodosPago.map(m => (
                <option key={m.id} value={m.nombre.toLowerCase()}>
                  {m.nombre} {m.requiere_comprobante !== false ? '📎' : '🏪'}
                </option>
              ))}
            </select>
            {esPagoTienda && (
              <small className="pf-hint" style={{ color: 'var(--teal-vivid)', marginTop: 4 }}>
                🏪 No requiere comprobante. Pago en tienda física.
              </small>
            )}
          </div>
        )}

        {/* ─── MODO TICKET: pago en tienda física ─────────────── */}
        {esPagoTienda && metodoPagoSeleccionado ? (
          <>
            <div className="pf-ticket" id="ticket-imprimible">
              <div className="pf-ticket-header">
                <span className="pf-eyebrow">Pago en tienda</span>
                <h2>{metodoPagoSeleccionado.nombre}</h2>
              </div>

              <div className="pf-folio">
                <span className="pf-folio-label">Folio</span>
                <span className="pf-folio-valor">{folio}</span>
              </div>

              <div className="pf-linea-punteada" />

              <div className="pf-monto">
                <span className="pf-monto-label">Monto a pagar en tienda</span>
                <span className="pf-monto-valor">${montoPendiente.toFixed(2)} MXN</span>
              </div>

              {datosExtra && (
                <>
                  <div className="pf-linea-punteada" />
                  <div className="pf-tienda-info">
                    {Object.entries(datosExtra).map(([clave, valor]) => (
                      <div className="pf-tienda-fila" key={clave}>
                        <span className="pf-tienda-label">{formatearEtiqueta(clave)}</span>
                        <span>{String(valor)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="pf-nota-ticket">
                Presenta este ticket (impreso o en tu celular) al momento de pagar.
                Tu pedido se marcará como pagado en cuanto el encargado registre el pago.
              </p>
            </div>

            {/* ✅ Formulario para pago en tienda - SIN referencia */}
            <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <div className="pf-group">
                <label htmlFor="notas-tienda">Observaciones (opcional)</label>
                <textarea
                  id="notas-tienda"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Voy a pasar por la tienda el lunes"
                  className="pf-textarea"
                  rows="2"
                />
              </div>

              {error && <div className="pf-error">{error}</div>}

              <button type="submit" className="pf-btn pf-btn--primary pf-btn--block" disabled={subiendo}>
                {subiendo ? 'Procesando...' : '🏪 Confirmar pago en tienda'}
              </button>
            </form>

            <button
              className="pf-btn pf-btn--secondary pf-btn--block pf-noprint"
              onClick={handleDescargarTicket}
              style={{ marginTop: 8 }}
            >
              Descargar / imprimir ticket
            </button>
          </>
        ) : (

          /* ─── MODO FORMULARIO: transferencia / depósito ───────── */
          <form onSubmit={handleSubmit}>
            <div className="pf-section-label">Cómo pagar</div>
            {metodoPagoSeleccionado ? (
              <div className="pf-banco">
                <div className="pf-banco-nombre">{metodoPagoSeleccionado.nombre}</div>

                {metodoPagoSeleccionado.instrucciones && (
                  <p className="pf-banco-instrucciones">{metodoPagoSeleccionado.instrucciones}</p>
                )}

                {datosExtra ? (
                  <div className="pf-banco-datos">
                    {Object.entries(datosExtra).map(([clave, valor]) => (
                      <button
                        type="button"
                        className="pf-dato"
                        key={clave}
                        onClick={() => copiarDato(valor, setCopiado)}
                      >
                        <span className="pf-dato-label">{formatearEtiqueta(clave)}</span>
                        <span className="pf-dato-valor">
                          {String(valor)}
                          <span className="pf-dato-copiar">
                            {copiado === valor ? 'Copiado ✓' : 'Copiar'}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="pf-banco-vacio">No hay datos bancarios configurados para este método.</p>
                )}

                <div className="pf-banco-monto">
                  Transfiere exactamente <strong>${montoPendiente.toFixed(2)} MXN</strong>
                </div>
              </div>
            ) : (
              <p className="pf-banco-vacio">Selecciona un método de pago para ver las instrucciones.</p>
            )}

            {/* Comprobante */}
            <div className="pf-group">
              <label htmlFor="comprobante">Comprobante de pago *</label>

              {!comprobante ? (
                <label htmlFor="comprobante" className="pf-dropzone">
                  <input
                    type="file"
                    id="comprobante"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="pf-file-input"
                  />
                  <span className="pf-dropzone-icon">↑</span>
                  <span className="pf-dropzone-text">Sube tu comprobante</span>
                  <span className="pf-dropzone-hint">JPG, PNG o PDF · máx 5MB</span>
                </label>
              ) : (
                <div className="pf-preview">
                  {comprobantePreview ? (
                    <img src={comprobantePreview} alt="Comprobante" />
                  ) : (
                    <div className="pf-preview-pdf">📄 {comprobante.name}</div>
                  )}
                  <button type="button" className="pf-preview-quitar" onClick={handleRemoveFile}>
                    Quitar
                  </button>
                </div>
              )}
            </div>

            {/* Notas opcionales */}
            <div className="pf-group">
              <label htmlFor="notas">Notas para el equipo (opcional)</label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej. número de referencia de tu transferencia, banco desde el que pagaste, etc."
                className="pf-textarea"
                rows="2"
              />
            </div>

            {error && <div className="pf-error">{error}</div>}

            <button type="submit" className="pf-btn pf-btn--primary pf-btn--block" disabled={subiendo}>
              {subiendo ? 'Enviando...' : '📤 Enviar comprobante'}
            </button>

            <p className="pf-nota-tiempo">Tu pago se verifica en 24–48 horas hábiles.</p>
          </form>
        )}
      </div>
    </div>
  );
}

// ✅ EXPORTACIÓN CORRECTA AL FINAL
export default PagoFinal;