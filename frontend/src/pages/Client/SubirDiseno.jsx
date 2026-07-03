// src/pages/Client/SubirDiseno.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/SubirDiseno.css';

const API_URL = import.meta.env.VITE_API_URL;

const SubirDiseno = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [notas, setNotas] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const subirArchivoSupabase = async (file, usuarioId) => {
    const fileName = `diseno_pedido_${id}_${Date.now()}_${file.name}`;
    const filePath = `disenos/usuario_${usuarioId}/${fileName}`;

    const { error } = await supabase.storage
      .from('borradores')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('borradores')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Opción 1: Subir archivo
  const handleSubirArchivo = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setSubiendo(true);
    setError(null);

    try {
      const token = getToken();
      const user = JSON.parse(localStorage.getItem('user'));

      const archivoUrl = await subirArchivoSupabase(archivo, user.id_usuario);

      await axios.post(
        `${API_URL}/api/client/pedidos/${id}/diseno`,
        {
          tipo_origen: 'ARCHIVO_SUBIDO',
          archivo_url: archivoUrl,
          notas_cliente: notas || descripcion
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
      console.error('Error:', err);
      setError(err.response?.data?.message || 'Error al subir el diseño');
    } finally {
      setSubiendo(false);
    }
  };

  // Opción 2: Ir al editor interactivo
  const irAlEditor = () => {
    navigate(`/cliente/pedido/${id}/editor`, {
      state: {
        pedidoId: id,
        modo: 'diseno_pedido'
      }
    });
  };

  return (
    <div className="sd-page">
      <div className="sd-container">
        {/* ─── HEADER ─── */}
        <div className="sd-header">
          <button className="sd-back" onClick={() => navigate(`/cliente/pedido/${id}`)}>
            ← Volver al pedido
          </button>
          <h2>🎨 Diseña tu producto</h2>
          <p>Elige cómo quieres crear tu diseño para el pedido #{id}</p>
        </div>

        {exito ? (
          <div className="sd-exito">
            <div className="sd-exito-icon">✅</div>
            <h3>¡Diseño enviado correctamente!</h3>
            <p>El administrador revisará tu diseño y te contactará pronto.</p>
            <button onClick={() => navigate(`/cliente/pedido/${id}`)}>
              Ver detalle del pedido
            </button>
          </div>
        ) : (
          <>
            {/* ─── TARJETAS DE OPCIONES ─── */}
            <div className="sd-cards">
              {/* Opción 1: Subir archivo */}
              <div
                className={`sd-card ${opcionSeleccionada === 'archivo' ? 'sd-card--selected' : ''}`}
                onClick={() => setOpcionSeleccionada('archivo')}
              >
                <div className="sd-card-icon">📎</div>
                <h3>Subir mi diseño</h3>
                <p>Sube un archivo con tu diseño (logo, imagen, boceto)</p>
                <span className="sd-card-badge">Recomendado</span>
              </div>

              {/* Opción 2: Editor interactivo */}
              <div
                className={`sd-card ${opcionSeleccionada === 'editor' ? 'sd-card--selected' : ''}`}
                onClick={() => setOpcionSeleccionada('editor')}
              >
                <div className="sd-card-icon">🎨</div>
                <h3>Crear desde cero</h3>
                <p>Usa nuestro editor interactivo para diseñar tu producto</p>
                <span className="sd-card-badge sd-card-badge--editor">Editor</span>
              </div>
            </div>

            {/* ─── CONTENIDO SEGÚN OPCIÓN ─── */}
            {opcionSeleccionada === 'archivo' && (
              <div className="sd-content">
                <form onSubmit={handleSubirArchivo}>
                  <div className="sd-group">
                    <label className="sd-label">📎 Sube tu diseño</label>
                    <div className="sd-file-area" onClick={() => document.getElementById('fileInput')?.click()}>
                      <input
                        id="fileInput"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="sd-file-input"
                      />
                      {previewUrl ? (
                        <div className="sd-preview">
                          <img src={previewUrl} alt="Preview" />
                          <button
                            type="button"
                            className="sd-preview-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchivo(null);
                              setPreviewUrl(null);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="sd-file-placeholder">
                          <span>📤</span>
                          <p>Haz clic para seleccionar tu diseño</p>
                          <small>PNG, JPG, PDF (máx. 10MB)</small>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sd-group">
                    <label className="sd-label">📝 Descripción del diseño</label>
                    <textarea
                      className="sd-textarea"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Describe lo que quieres: colores, posición, texto, etc."
                      rows="4"
                    />
                  </div>

                  <div className="sd-group">
                    <label className="sd-label">📌 Notas adicionales (opcional)</label>
                    <textarea
                      className="sd-textarea"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Algún detalle extra que quieras agregar..."
                      rows="2"
                    />
                  </div>

                  {error && <div className="sd-error">{error}</div>}

                  <button
                    type="submit"
                    className="sd-submit"
                    disabled={subiendo || !archivo}
                  >
                    {subiendo ? 'Subiendo...' : '📤 Enviar diseño'}
                  </button>
                </form>
              </div>
            )}

            {opcionSeleccionada === 'editor' && (
              <div className="sd-content sd-content-editor">
                <div className="sd-editor-info">
                  <span>🎨</span>
                  <h3>Editor interactivo</h3>
                  <p>Crea tu propio diseño usando nuestro editor visual. Puedes agregar texto, imágenes y personalizar colores.</p>
                </div>

                <button
                  className="sd-editor-btn"
                  onClick={irAlEditor}
                >
                  🎨 Abrir editor interactivo
                </button>

                <div className="sd-editor-features">
                  <h4>Lo que puedes hacer:</h4>
                  <div className="sd-features-grid">
                    <div className="sd-feature">
                      <span>✏️</span>
                      <p>Agregar texto personalizado</p>
                    </div>
                    <div className="sd-feature">
                      <span>🖼️</span>
                      <p>Subir imágenes o logos</p>
                    </div>
                    <div className="sd-feature">
                      <span>🎨</span>
                      <p>Ajustar colores y tamaños</p>
                    </div>
                    <div className="sd-feature">
                      <span>💾</span>
                      <p>Guardar tu diseño</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubirDiseno;