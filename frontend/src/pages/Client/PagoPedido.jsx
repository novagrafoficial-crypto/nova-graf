// src/pages/Client/PagoPedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { supabase } from '../../lib/supabase';
import '../../styles/client/PagoPedido.css';

const API_URL = import.meta.env.VITE_API_URL;

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

  useEffect(() => {
    const fetchPedido = async () => {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/api/client/pedidos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPedido(res.data);
        console.log('📦 Pedido cargado:', res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setComprobante(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const subirArchivoSupabase = async (file, usuarioId) => {
    const fileName = `comprobante_pedido_${id}_${Date.now()}_${file.name}`;
    const filePath = `comprobantes/usuario_${usuarioId}/${fileName}`;
    
    console.log(`📤 Subiendo comprobante a Supabase: ${filePath}`);
    
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
    
    console.log(`✅ Comprobante subido: ${publicUrl}`);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comprobante) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setSubiendo(true);
    setError(null);

    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user'));
      
      const comprobanteUrl = await subirArchivoSupabase(comprobante, user.id_usuario);
      
      const payload = {
        tipo_pago: 'ANTICIPO',
        monto: pedido.monto_anticipo,
        comprobante_url: comprobanteUrl
      };
      
      console.log('📤 Enviando al backend:', payload);
      
      const response = await axios.post(
        `${API_URL}/api/client/pedidos/${id}/comprobante`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Respuesta del backend:', response.data);
      
      setExito(true);
      // ✅ REDIRIGIR AL DETALLE DEL PEDIDO
      setTimeout(() => {
        navigate(`/cliente/pedido/${id}`);
      }, 3000);
    } catch (err) {
      console.error('❌ Error:', err);
      console.error('❌ Respuesta del error:', err.response?.data);
      setError(err.response?.data?.message || 'Error al subir el comprobante');
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) return <div className="pago-loading">Cargando...</div>;
  if (error) return <div className="pago-error">{error}</div>;
  if (!pedido) return <div className="pago-error">Pedido no encontrado</div>;

  const pagoExistente = pedido.pagos?.find(p => p.tipo_pago === 'ANTICIPO');
  if (pagoExistente) {
    return (
      <div className="pago-wrapper">
        <div className="pago-card pago-card--success">
          <div className="pago-icon-circle">
            <span className="pago-icon">✅</span>
          </div>
          
          <h2 className="pago-title">¡Pago registrado!</h2>
          <p className="pago-subtitle">Tu comprobante está siendo verificado por el administrador.</p>
          
          <div className="pago-info-box">
            <div className="pago-info-row">
              <span className="pago-info-label">💳 Monto</span>
              <span className="pago-info-value">${pedido.monto_anticipo}</span>
            </div>
            <div className="pago-info-row">
              <span className="pago-info-label">📌 Estado</span>
              <span className="pago-info-value pago-status-pending">⏳ En verificación</span>
            </div>
            {pagoExistente.comprobante_url && (
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
          Realiza la transferencia y sube el comprobante para confirmar tu pedido
        </p>

        <div className="pago-datos-bancarios">
          <h3>Datos de transferencia</h3>
          <div className="banco-info">
            <p><strong>Banco:</strong> BBVA</p>
            <p><strong>Cuenta:</strong> 1234 5678 9012 3456</p>
            <p><strong>CLABE:</strong> 012 345 6789 0123456789</p>
            <p><strong>Beneficiario:</strong> NovaGraf S.A. de C.V.</p>
          </div>
        </div>

        <div className="pago-monto">
          <h3>Monto a pagar</h3>
          <p className="monto">${pedido.monto_anticipo}</p>
          <p className="monto-detalle">50% del total del pedido</p>
        </div>

        <form onSubmit={handleSubmit} className="pago-form">
          <div className="form-group">
            <label htmlFor="comprobante">Comprobante de pago</label>
            
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
      </div>
    </div>
  );
};

export default PagoPedido;