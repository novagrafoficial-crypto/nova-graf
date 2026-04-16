import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/SolicitarDiseno.css';

const API_URL = import.meta.env.VITE_API_URL;

const SolicitarDiseno = () => {
  const { id: productoId } = useParams();
  const location = useLocation();
  const { variante } = location.state || {};
  const navigate = useNavigate();

  const [descripcion, setDescripcion] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef();
  const [precioBase, setPrecioBase] = useState(null);

  useEffect(() => {
    if (variante && variante.precio_base) {
      setPrecioBase(parseFloat(variante.precio_base));
    }
  }, [variante]);

  if (!variante) {
    return (
      <div className="sd-page">
        <div className="sd-container">
          <div className="sd-alert">⚠️ Información del producto no disponible.</div>
          <button className="sd-button" onClick={() => navigate(-1)}>Volver</button>
        </div>
      </div>
    );
  }

  const handleArchivos = (e) => {
    const files = Array.from(e.target.files);
    setArchivos(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
  };

  const eliminarPreview = (index) => {
    const nuevosArchivos = [...archivos];
    const nuevasPreviews = [...previews];
    nuevosArchivos.splice(index, 1);
    nuevasPreviews.splice(index, 1);
    setArchivos(nuevosArchivos);
    setPreviews(nuevasPreviews);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const subirArchivos = async (usuarioId) => {
    const urls = [];
    for (const file of archivos) {
      const fileName = `solicitud_${Date.now()}_${file.name}`;
      const filePath = `solicitudes/${usuarioId}/${fileName}`;
      const { error } = await supabase.storage.from('borradores').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('borradores').getPublicUrl(filePath);
      urls.push(publicUrl);
    }
    return urls;
  };

  const enviarSolicitud = async () => {
    const token = getToken();
    if (!token) {
      alert('Debes iniciar sesión');
      return;
    }
    if (!descripcion.trim()) {
      alert('Por favor describe tu idea');
      return;
    }
    setSubiendo(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      let archivosUrls = [];
      if (archivos.length) {
        archivosUrls = await subirArchivos(user.id_usuario);
      }

      // 1. Crear la solicitud de diseño
      console.log('📝 Creando solicitud de diseño...');
      const solicitudRes = await axios.post(`${API_URL}/api/client/solicitudes-diseno`, {
        variante_id: variante.variante_id || variante.id,
        descripcion_cliente: descripcion,
        archivos_referencia: archivosUrls,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { precio_base } = solicitudRes.data;
      console.log('✅ Solicitud creada, precio_base:', precio_base);

      // 2. Preparar payload para carrito (mismo formato que MisDisenos)
      const textoPersonalizado = descripcion.trim() || "Diseño personalizado";
      const imagenPreview = archivosUrls.length > 0 ? archivosUrls[0] : null;
      
      // Calcular precio unitario igual que en MisDisenos
      const precioAdicionalPersonalizacion = 50; // mismo valor que en MisDisenos
      const precioBaseNum = parseFloat(precio_base || 0);
      const precioAdicionalVariante = parseFloat(variante.precio_adicional || 0);
      const precioUnitario = precioBaseNum + precioAdicionalVariante + precioAdicionalPersonalizacion;

      const payload = {
        variante_id: variante.variante_id || variante.id,
        texto_personalizado: textoPersonalizado,
        imagen_personalizada_url: imagenPreview,
        precio_adicional: precioAdicionalPersonalizacion,
        precio_unitario: precioUnitario,
        cantidad: 1,
      };

      console.log('🚀 Enviando al carrito payload:', JSON.stringify(payload, null, 2));

      // 3. Agregar al carrito
      const carritoRes = await axios.post(`${API_URL}/api/client/carrito`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Producto agregado al carrito:', carritoRes.data);

      // 4. Redirigir al carrito
      navigate('/cliente/carrito', { 
        state: { mensaje: 'Solicitud creada. Procede al pago del 50% de anticipo para recibir tu previo.' }
      });
    } catch (err) {
      // Captura DETALLADA del error
      console.error('❌ ERROR COMPLETO:');
      console.error('- Mensaje:', err.message);
      if (err.response) {
        console.error('- Código de estado:', err.response.status);
        console.error('- Datos del error (backend):', err.response.data);
        console.error('- Headers:', err.response.headers);
        alert(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        console.error('- No se recibió respuesta del servidor');
        alert('Error de red: No se pudo conectar con el servidor');
      } else {
        console.error('- Error al configurar la petición:', err.message);
        alert('Error inesperado: ' + err.message);
      }
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="sd-page">
      <div className="sd-container">
        <div className="sd-header">
          <h2>Solicitar diseño personalizado</h2>
          <p>Describe tu idea y sube imágenes de referencia (logos, bocetos, etc.)</p>
        </div>

        {/* AVISO DE PAGO ANTICIPADO */}
        <div className="sd-aviso-pago">
          <div className="sd-aviso-icon">💰</div>
          <div className="sd-aviso-texto">
            <strong>Proceso de diseño personalizado:</strong>
            <ul>
              <li>Al enviar esta solicitud, el producto se agregará a tu carrito.</li>
              <li>Deberás pagar el <strong>50% de anticipo</strong> del producto base para que nuestro diseñador prepare hasta <strong>2 previos digitales</strong>.</li>
              <li>Si apruebas el diseño, podrás pagar el saldo restante y procederemos a la personalización y envío.</li>
            </ul>
            {precioBase && (
              <p className="sd-anticipo-info">
                <strong>Producto base:</strong> ${precioBase.toFixed(2)} MXN<br />
                <strong>Anticipo (50%):</strong> ${(precioBase * 0.5).toFixed(2)} MXN
              </p>
            )}
          </div>
        </div>

        <div className="sd-body">
          <div className="sd-group">
            <label className="sd-label">Descripción de tu diseño <span>*</span></label>
            <textarea 
              className="sd-textarea" 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              placeholder="Ej: Quiero una camiseta con un león y mi nombre en la espalda..." 
              rows={5} 
            />
          </div>

          <div className="sd-group">
            <label className="sd-label">Imágenes de referencia</label>
            <div className="sd-file-area" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleArchivos} 
                ref={fileInputRef} 
                className="sd-file-input" 
              />
              <div className="sd-file-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16M4 12h16" />
                </svg>
                Subir archivos
              </div>
              <span className="sd-file-hint">PNG, JPG, WEBP (máx. 5MB cada uno)</span>
            </div>
          </div>

          {previews.length > 0 && (
            <div className="sd-previews">
              {previews.map((url, idx) => (
                <div key={idx} className="sd-preview-item">
                  <img src={url} alt={`preview-${idx}`} className="sd-preview-img" />
                  <button className="sd-preview-remove" onClick={() => eliminarPreview(idx)}>✕</button>
                </div>
              ))}
            </div>
          )}

          <button 
            className="sd-button" 
            onClick={enviarSolicitud} 
            disabled={subiendo}
          >
            {subiendo ? 'Enviando solicitud...' : 'Solicitar diseño y agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolicitarDiseno;