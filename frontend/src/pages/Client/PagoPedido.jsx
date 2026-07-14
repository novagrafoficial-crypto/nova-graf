// src/pages/Client/PagoPedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { supabase } from '../../lib/supabase';
import '../../styles/client/PagoPedido.css';

const API_URL = import.meta.env.VITE_API_URL;

// ✅ Normaliza datos bancarios
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

// ✅ Normaliza requiere_comprobante
const requiereComprobante = (metodo) => {
  if (!metodo) return true;
  const val = metodo.requiere_comprobante;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const v = val.trim().toLowerCase();
    return !['false', 'no', 'n', '0'].includes(v);
  }
  return true;
};

const PagoPedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [comprobante, setComprobante] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [notas, setNotas] = useState('');
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(null);
  const [metodosPago, setMetodosPago] = useState([]); // ✅ GUARDAR CATÁLOGO

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // 1. Obtener pedido
        const pedidoRes = await axios.get(`${API_URL}/api/client/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedido(pedidoRes.data);
        console.log('📦 Pedido:', pedidoRes.data);

        // 2. ✅ OBTENER CATÁLOGO DE MÉTODOS DE PAGO
        const pagoRes = await axios.get(`${API_URL}/api/client/checkout/metodos-pago`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('💳 Catálogo métodos de pago:', pagoRes.data);
        setMetodosPago(pagoRes.data || []);

        // 3. ✅ BUSCAR EL MÉTODO DE PAGO POR ID
        const metodoId = pedidoRes.data?.metodo_pago_id;
        console.log('🔍 Buscando método con ID:', metodoId);

        if (metodoId) {
          const metodoEncontrado = (pagoRes.data || []).find(
            m => m.id === metodoId
          );
          console.log('✅ Método encontrado:', metodoEncontrado);
          setMetodoPagoSeleccionado(metodoEncontrado || null);
        } else {
          console.warn('⚠️ El pedido no tiene metodo_pago_id');
          setMetodoPagoSeleccionado(null);
        }

      } catch (err) {
        console.error('❌ Error al cargar datos:', err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // ✅ Si el método no requiere comprobante, limpia el archivo
  useEffect(() => {
    if (metodoPagoSeleccionado && !requiereComprobante(metodoPagoSeleccionado)) {
      setComprobante(null);
      setPreviewUrl(null);
      setError(null);
    }
  }, [metodoPagoSeleccionado]);

  const handleRemoveFile = () => {
    setComprobante(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    const fileInput = document.getElementById('comprobante');
    if (fileInput) {
      fileInput.value = '';
    }
  };

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setComprobante(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const subirArchivoSupabase = async (file, usuarioId, tipo = 'ANTICIPO') => {
    const user = JSON.parse(localStorage.getItem('user'));
    const clienteNombre = (user?.nombre || 'cliente')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const fechaStr = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();

    const fileName = `${tipo}_Pedido_${id}_Cliente_${clienteNombre}_${fechaStr}_${timestamp}.${extension}`;
    const filePath = `comprobantes/usuario_${usuarioId}/${fileName}`;

    const { error } = await supabase.storage
      .from('borradores')
      .upload(filePath, file);

    if (error) {
      console.error('❌ Error al subir a Supabase:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('borradores')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const esPagoTienda = metodoPagoSeleccionado
      ? !requiereComprobante(metodoPagoSeleccionado)
      : false;

    if (!esPagoTienda && !comprobante) {
      setError('Por favor selecciona un comprobante de pago');
      return;
    }

    setSubiendo(true);
    setError(null);

    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user'));
      let comprobanteUrl = null;

      if (comprobante) {
        comprobanteUrl = await subirArchivoSupabase(comprobante, user.id_usuario, 'ANTICIPO');
      }

      const payload = {
        tipo_pago: 'ANTICIPO',
        monto: pedido.monto_anticipo,
        comprobante_url: comprobanteUrl || 'TIENDA_FISICA',
        notas_admin: notas.trim() || null
      };

      await axios.post(
        `${API_URL}/api/client/pedidos/${id}/comprobante`,
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
      }, 3000);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || 'Error al subir el comprobante');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargarTicket = () => {
    window.print();
  };

  if (loading) return <div className="pago-loading">Cargando...</div>;
  if (error) return <div className="pago-error">{error}</div>;
  if (!pedido) return <div className="pago-error">Pedido no encontrado</div>;

  const pagoExistente = pedido.pagos?.find(p => p.tipo_pago === 'ANTICIPO');
  const esPagoTienda = metodoPagoSeleccionado
    ? !requiereComprobante(metodoPagoSeleccionado)
    : false;
  
  // ✅ OBTENER DATOS BANCARIOS
  const datosExtra = normalizarDatosExtra(metodoPagoSeleccionado?.datos_bancarios);
  const tieneDatosBancarios = datosExtra && Object.keys(datosExtra).length > 0;
  
  const folio = `NG-${String(id).padStart(5, '0')}`;

  // ✅ DEBUG
  console.log('🔍 DEBUG PagoPedido:');
  console.log('  - metodoPagoSeleccionado:', metodoPagoSeleccionado);
  console.log('  - datosExtra:', datosExtra);
  console.log('  - tieneDatosBancarios:', tieneDatosBancarios);

  // ✅ Si ya existe pago de anticipo
  if (pagoExistente) {
    return (
      <div className="pago-wrapper">
        <div className="pago-card pago-card--success">
          <div className="pago-icon-circle">
            <span className="pago-icon">✅</span>
          </div>

          <h2 className="pago-title">
            {pagoExistente.comprobante_url === 'TIENDA_FISICA' 
              ? '¡Pago en tienda registrado!' 
              : '¡Pago registrado!'}
          </h2>
          <p className="pago-subtitle">
            {pagoExistente.comprobante_url === 'TIENDA_FISICA'
              ? 'El administrador confirmará tu pago en breve.'
              : 'Tu comprobante está siendo verificado por el administrador.'}
          </p>

          <div className="pago-info-box">
            <div className="pago-info-row">
              <span className="pago-info-label">💳 Monto</span>
              <span className="pago-info-value">${pedido.monto_anticipo}</span>
            </div>
            <div className="pago-info-row">
              <span className="pago-info-label">📌 Estado</span>
              <span className="pago-info-value pago-status-pending">⏳ En verificación</span>
            </div>
            {pagoExistente.comprobante_url && pagoExistente.comprobante_url !== 'TIENDA_FISICA' && (
              <div className="pago-info-row">
                <span className="pago-info-label">📎 Comprobante</span>
                <a
                  href={pagoExistente.comprobante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pago-info-link"
                >
                  Ver comprobante
                </a>
              </div>
            )}
          </div>

          <div className="pago-actions">
            <button
              className="pago-btn pago-btn-primary"
              onClick={() => navigate(`/cliente/pedido/${id}`)}
            >
              📋 Ver detalle del pedido
            </button>
            <button
              className="pago-btn pago-btn-secondary"
              onClick={() => navigate('/cliente/perfil', { state: { activeTab: 'pedidos' } })}
            >
              ← Volver a mis pedidos
            </button>
          </div>

          {pagoExistente.notas_admin && (
            <div className="pago-nota-admin">
              <span>📝</span>
              <p><strong>Nota del administrador:</strong> {pagoExistente.notas_admin}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ Si el pedido no está en estado PENDIENTE_VERIFICACION
  if (pedido.estado !== 'PENDIENTE_VERIFICACION') {
    return (
      <div className="pago-wrapper">
        <div className="pago-card">
          <div className="pago-icon-circle pago-icon-circle--info">
            <span className="pago-icon">ℹ️</span>
          </div>
          <h2 className="pago-title">Pedido en proceso</h2>
          <p className="pago-subtitle">Estado actual: <strong>{pedido.estado}</strong></p>
          <div className="pago-actions">
            <button
              className="pago-btn pago-btn-primary"
              onClick={() => navigate(`/cliente/pedido/${id}`)}
            >
              📋 Ver detalle del pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pago-wrapper">
      <div className="pago-card">
        <h2>Pago del anticipo</h2>
        <p className="pago-subtitulo">
          {esPagoTienda
            ? 'Acude a nuestra tienda para realizar el pago del anticipo'
            : 'Realiza la transferencia y sube el comprobante para confirmar tu pedido'}
        </p>

        {/* ✅ MOSTRAR MÉTODO DE PAGO */}
        {metodoPagoSeleccionado && (
          <div className="pago-metodo-fijo">
            <div className="pago-metodo-badge">
              <span className="pago-metodo-icon">
                {esPagoTienda ? '🏪' : '📎'}
              </span>
              <span className="pago-metodo-nombre">
                <strong>{metodoPagoSeleccionado.nombre}</strong>
              </span>
              <span className="pago-metodo-tipo">
                {esPagoTienda ? 'Pago en tienda' : 'Requiere comprobante'}
              </span>
            </div>

            {metodoPagoSeleccionado.instrucciones && (
              <div className="pago-instrucciones">
                <strong>📌 Instrucciones:</strong>
                <p>{metodoPagoSeleccionado.instrucciones}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── MODO TICKET: PAGO EN TIENDA ─────────────────────── */}
        {esPagoTienda && metodoPagoSeleccionado ? (
          <>
            <div className="pago-ticket" id="ticket-imprimible-anticipo">
              <div className="pago-ticket-header">
                <span className="pago-ticket-eyebrow">Pago en tienda</span>
                <h2>{metodoPagoSeleccionado.nombre}</h2>
                <p className="pago-ticket-sub">Anticipo 50%</p>
              </div>

              <div className="pago-ticket-folio">
                <span className="pago-ticket-folio-label">Folio</span>
                <span className="pago-ticket-folio-valor">{folio}</span>
              </div>

              <div className="pago-ticket-linea" />

              <div className="pago-ticket-monto">
                <span className="pago-ticket-monto-label">Monto a pagar en tienda</span>
                <span className="pago-ticket-monto-valor">${pedido.monto_anticipo} MXN</span>
                <span className="pago-ticket-monto-detalle">50% del total del pedido</span>
              </div>

              {tieneDatosBancarios && (
                <>
                  <div className="pago-ticket-linea" />
                  <div className="pago-tienda-info">
                    {Object.entries(datosExtra).map(([clave, valor]) => (
                      <div className="pago-tienda-fila" key={clave}>
                        <span className="pago-tienda-label">{formatearEtiqueta(clave)}</span>
                        <span>{String(valor)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="pago-ticket-nota">
                Presenta este ticket (impreso o en tu celular) al momento de pagar.
                <br />
                Tu pedido se marcará como pagado en cuanto el encargado registre el pago.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="pago-form" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label htmlFor="notas-tienda">Observaciones (opcional)</label>
                <textarea
                  id="notas-tienda"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Voy a pasar por la tienda el lunes"
                  className="pago-textarea"
                  rows="2"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="pago-btn-submit" 
                disabled={subiendo}
                style={{ backgroundColor: '#35BA99' }}
              >
                {subiendo ? '⏳ Procesando...' : '🏪 Confirmar pago en tienda'}
              </button>
            </form>

            <button
              className="pago-btn-ticket"
              onClick={handleDescargarTicket}
              style={{ marginTop: 8 }}
            >
              🖨️ Descargar / imprimir ticket
            </button>
          </>
        ) : (
          /* ─── MODO FORMULARIO: TRANSFERENCIA ─────────────────── */
          <>
            <div className="pago-datos-bancarios">
              <h3>
                {metodoPagoSeleccionado?.nombre || 'Datos de transferencia'}
              </h3>
              
              {metodoPagoSeleccionado?.instrucciones && (
                <div className="pago-instrucciones-detalle">
                  <p>{metodoPagoSeleccionado.instrucciones}</p>
                </div>
              )}

              {tieneDatosBancarios ? (
                <div className="banco-info">
                  {Object.entries(datosExtra).map(([clave, valor]) => (
                    <p key={clave}>
                      <strong>{formatearEtiqueta(clave)}:</strong> {String(valor)}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="banco-info-vacio">
                  <span className="banco-info-vacio-icon">⚠️</span>
                  <p>
                    <strong>Este método de pago no tiene datos bancarios registrados.</strong>
                    <br />
                    <span className="banco-info-vacio-ayuda">
                      Contacta al administrador para confirmar cómo realizar la transferencia.
                    </span>
                  </p>
                </div>
              )}

              <div className="pago-banco-monto">
                <span>Transfiere exactamente:</span>
                <strong>${pedido.monto_anticipo} MXN</strong>
                <small>(50% del total del pedido)</small>
              </div>
            </div>

            <div className="pago-monto">
              <h3>Monto a pagar</h3>
              <p className="monto">${pedido.monto_anticipo}</p>
              <p className="monto-detalle">50% del total del pedido</p>
            </div>

            <form onSubmit={handleSubmit} className="pago-form">
              <div className="form-group">
                <label htmlFor="comprobante">Comprobante de pago *</label>

                <div className="pago-file-area">
                  <input
                    type="file"
                    id="comprobante"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="pago-file-input"
                  />

                  {!comprobante ? (
                    <div className="pago-file-placeholder">
                      <span className="pago-file-icon">📎</span>
                      <span>Seleccionar archivo</span>
                      <span className="pago-file-hint">JPG, PNG, PDF (máx. 5MB)</span>
                    </div>
                  ) : (
                    <div className="pago-file-selected">
                      <div className="pago-file-info">
                        <span className="pago-file-name">📄 {comprobante.name}</span>
                        <span className="pago-file-size">
                          {(comprobante.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="pago-file-remove"
                        onClick={handleRemoveFile}
                        title="Eliminar archivo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {previewUrl && (
                  <div className="preview-container">
                    <img src={previewUrl} alt="Preview" className="preview-image" />
                  </div>
                )}

                <small>Formatos permitidos: JPG, PNG, PDF (máx. 5MB)</small>
              </div>

              <div className="form-group">
                <label htmlFor="notas">Notas adicionales (opcional)</label>
                <textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Banco desde el que pagaste, referencia adicional, etc."
                  className="pago-textarea"
                  rows="2"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              {exito && (
                <div className="exito-message">
                  ✅ Comprobante subido correctamente. Será verificado por el administrador.
                </div>
              )}

              <button type="submit" className="pago-btn-submit" disabled={subiendo || exito || !comprobante}>
                {subiendo ? '⏳ Subiendo...' : '📤 Subir comprobante'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PagoPedido;