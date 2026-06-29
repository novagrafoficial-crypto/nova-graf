// src/pages/Client/PagoPedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { supabase } from '../../lib/supabase'; // ← IMPORTANTE: usar supabase del frontend
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
      } catch (err) {
        console.error(err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setComprobante(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 🔥 FUNCIÓN PARA SUBIR A SUPABASE (IGUAL QUE EN SolicitarDiseno)
  const subirArchivoSupabase = async (file, usuarioId) => {
    const fileName = `comprobante_pedido_${id}_${Date.now()}_${file.name}`;
    const filePath = `comprobantes/usuario_${usuarioId}/${fileName}`;
    
    console.log(`📤 Subiendo comprobante a Supabase: ${filePath}`);
    
    const { error } = await supabase.storage
      .from('borradores') // ← Mismo bucket
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
      
      // 🔥 1. Subir comprobante a Supabase (desde el frontend)
      const comprobanteUrl = await subirArchivoSupabase(comprobante, user.id_usuario);
      
      // 🔥 2. Enviar la URL al backend
      const response = await axios.post(
        `${API_URL}/api/client/pedidos/${id}/comprobante`,
        {
          tipo_pago: 'ANTICIPO',
          monto: pedido.monto_anticipo,
          metodo_pago: 'TRANSFERENCIA',
          comprobante_url: comprobanteUrl // ← Enviamos la URL, no el archivo
        },
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
      console.error(err);
      setError(err.response?.data?.message || 'Error al subir el comprobante');
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) return <div className="pago-loading">Cargando...</div>;
  if (error) return <div className="pago-error">{error}</div>;
  if (!pedido) return <div className="pago-error">Pedido no encontrado</div>;

  // Si ya hay un pago registrado
  const pagoExistente = pedido.pagos?.find(p => p.tipo_pago === 'ANTICIPO');
  if (pagoExistente) {
    return (
      <div className="pago-wrapper">
        <div className="pago-card">
          <h2>Pago registrado</h2>
          <p className="pago-subtitulo">Tu comprobante está siendo verificado</p>
          <div className="pago-info">
            <p><strong>Monto:</strong> ${pedido.monto_anticipo}</p>
            <p><strong>Estado:</strong> {pagoExistente.estado_pago}</p>
          </div>
          <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
            Ver detalle del pedido
          </button>
        </div>
      </div>
    );
  }

  if (pedido.estado !== 'PENDIENTE_VERIFICACION') {
    return (
      <div className="pago-wrapper">
        <div className="pago-card">
          <h2>Pedido en proceso</h2>
          <p className="pago-subtitulo">Estado actual: {pedido.estado}</p>
          <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
            Ver detalle
          </button>
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
            <input
              type="file"
              id="comprobante"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required
            />
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

          <button type="submit" disabled={subiendo || exito}>
            {subiendo ? 'Subiendo...' : 'Subir comprobante'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PagoPedido;