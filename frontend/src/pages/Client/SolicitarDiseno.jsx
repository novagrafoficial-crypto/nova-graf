import { useState, useRef } from 'react';
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
      await axios.post(`${API_URL}/api/client/solicitudes-diseno`, {
        variante_id: variante.variante_id || variante.id,
        descripcion_cliente: descripcion,
        archivos_referencia: archivosUrls,
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Solicitud enviada. Recibirás respuesta por correo.');
      navigate('/cliente/perfil', { state: { activeTab: 'Pedidos' } });  // ← Redirige a Pedidos
    } catch (err) {
      console.error(err);
      alert('Error al enviar la solicitud');
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
        <div className="sd-body">
          <div className="sd-group">
            <label className="sd-label">Descripción de tu diseño <span>*</span></label>
            <textarea className="sd-textarea" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Quiero una camiseta con un león y mi nombre en la espalda..." rows={5} />
          </div>
          <div className="sd-group">
            <label className="sd-label">Imágenes de referencia</label>
            <div className="sd-file-area" onClick={() => fileInputRef.current?.click()}>
              <input type="file" multiple accept="image/*" onChange={handleArchivos} ref={fileInputRef} className="sd-file-input" />
              <div className="sd-file-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16M4 12h16" /></svg>
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
          <button className="sd-button" onClick={enviarSolicitud} disabled={subiendo}>
            {subiendo ? 'Enviando solicitud...' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolicitarDiseno;