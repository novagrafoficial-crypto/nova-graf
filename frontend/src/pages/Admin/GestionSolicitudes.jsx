import { useEffect, useState } from 'react';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import { supabase } from '../../lib/supabase'; // si usas Supabase para subir imágenes
import '../../styles/admin/GestionSolicitudes.css'; // opcional

const API_URL = import.meta.env.VITE_API_URL;

const GestionSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoPropuesta, setSubiendoPropuesta] = useState({}); // { solicitudId: boolean }
  const [filtro, setFiltro] = useState('pendientes'); // 'pendientes', 'todas'

  // Cargar solicitudes
  const cargarSolicitudes = async () => {
    const token = getToken();
    if (!token) return;
    try {
      let url = `${API_URL}/api/admin/solicitudes-diseno/pendientes`;
      if (filtro === 'todas') {
        // Podrías crear otro endpoint para obtener todas, pero por ahora solo pendientes
        url = `${API_URL}/api/admin/solicitudes-diseno/todas`; // si lo implementas
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolicitudes(res.data);
    } catch (err) {
      console.error(err);
      alert('Error al cargar solicitudes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, [filtro]);

  // Subir una propuesta (imagen + descripción + costo)
  const subirPropuesta = async (solicitudId, imagenFile, descripcion, costoDiseno) => {
    if (!imagenFile) {
      alert('Selecciona una imagen');
      return;
    }
    setSubiendoPropuesta(prev => ({ ...prev, [solicitudId]: true }));
    try {
      // Subir imagen a Supabase (o a tu servidor)
      const fileName = `propuesta_${Date.now()}_${imagenFile.name}`;
      const filePath = `propuestas/${solicitudId}/${fileName}`;
      const { error, data } = await supabase.storage
        .from('propuestas') // asegúrate de tener este bucket
        .upload(filePath, imagenFile);
      if (error) throw error;
      const { publicUrl } = supabase.storage.from('propuestas').getPublicUrl(filePath).data;

      const token = getToken();
      await axios.post(`${API_URL}/api/admin/solicitudes/${solicitudId}/propuestas`, {
        imagen_url: publicUrl,
        descripcion: descripcion || '',
        costo_diseno: costoDiseno || 0
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('Propuesta subida correctamente');
      cargarSolicitudes(); // refrescar
    } catch (err) {
      console.error(err);
      alert('Error al subir propuesta');
    } finally {
      setSubiendoPropuesta(prev => ({ ...prev, [solicitudId]: false }));
    }
  };

  // Cambiar estado de la solicitud
  const cambiarEstado = async (solicitudId, nuevoEstado, observaciones = '') => {
    const token = getToken();
    try {
      await axios.put(`${API_URL}/api/admin/solicitudes/${solicitudId}/estado`, {
        estado: nuevoEstado,
        observaciones
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert(`Estado cambiado a ${nuevoEstado}`);
      cargarSolicitudes();
    } catch (err) {
      console.error(err);
      alert('Error al cambiar estado');
    }
  };

  if (cargando) return <div className="admin-loading">Cargando solicitudes...</div>;

  return (
    <div className="admin-solicitudes-container">
      <div className="admin-header">
        <h1>Gestión de Solicitudes de Diseño</h1>
        <div className="filtros">
          <button onClick={() => setFiltro('pendientes')} className={filtro === 'pendientes' ? 'active' : ''}>
            Pendientes
          </button>
          <button onClick={() => setFiltro('todas')} className={filtro === 'todas' ? 'active' : ''}>
            Todas
          </button>
        </div>
      </div>

      {solicitudes.length === 0 && <p>No hay solicitudes para mostrar.</p>}

      {solicitudes.map(sol => (
        <div key={sol.id} className="solicitud-card">
          <div className="solicitud-header">
            <h3>Solicitud #{sol.id}</h3>
            <span className={`estado estado-${sol.estado}`}>{sol.estado.replace('_', ' ')}</span>
          </div>
          
          <div className="solicitud-info">
            <p><strong>Cliente:</strong> {sol.usuario?.nombre || 'N/A'} ({sol.usuario?.email})</p>
            <p><strong>Fecha:</strong> {new Date(sol.fecha_solicitud).toLocaleString()}</p>
            <p><strong>Producto:</strong> {sol.variante?.color || 'No especificado'} {sol.variante?.precio_base ? ` - $${sol.variante.precio_base}` : ''}</p>
            <p><strong>Descripción:</strong> {sol.descripcion_cliente}</p>
          </div>

          {/* Imágenes de referencia del cliente */}
          {sol.archivos_referencia && sol.archivos_referencia.length > 0 && (
            <div className="referencias">
              <strong>Referencias del cliente:</strong>
              <div className="imagenes-grid">
                {sol.archivos_referencia.map((url, idx) => (
                  <img key={idx} src={url} alt={`ref-${idx}`} onClick={() => window.open(url, '_blank')} />
                ))}
              </div>
            </div>
          )}

          {/* Propuestas ya subidas */}
          {sol.propuestas && sol.propuestas.length > 0 && (
            <div className="propuestas-enviadas">
              <strong>Propuestas enviadas:</strong>
              <div className="propuestas-list">
                {sol.propuestas.map(prop => (
                  <div key={prop.id} className="propuesta-item">
                    <img src={prop.imagen_url} alt="propuesta" />
                    <p>{prop.descripcion}</p>
                    <span className={prop.es_aprobada ? 'aprobada' : 'no-aprobada'}>
                      {prop.es_aprobada ? '✓ Aprobada' : 'Pendiente de aprobación'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario para nueva propuesta (solo si no está aprobada o rechazada) */}
          {sol.estado !== 'aprobado' && sol.estado !== 'rechazado' && (
            <div className="nueva-propuesta">
              <h4>Subir nueva propuesta</h4>
              <div className="form-propuesta">
                <input type="file" accept="image/*" id={`file-${sol.id}`} />
                <input type="text" placeholder="Descripción de la propuesta" id={`desc-${sol.id}`} />
                <input type="number" placeholder="Costo de diseño (adicional)" id={`costo-${sol.id}`} step="0.01" />
                <button 
                  onClick={() => {
                    const file = document.getElementById(`file-${sol.id}`).files[0];
                    const desc = document.getElementById(`desc-${sol.id}`).value;
                    const costo = document.getElementById(`costo-${sol.id}`).value;
                    subirPropuesta(sol.id, file, desc, costo);
                  }}
                  disabled={subiendoPropuesta[sol.id]}
                >
                  {subiendoPropuesta[sol.id] ? 'Subiendo...' : 'Subir propuesta'}
                </button>
              </div>
            </div>
          )}

          {/* Acciones de estado */}
          <div className="acciones-estado">
            <select defaultValue={sol.estado} onChange={(e) => cambiarEstado(sol.id, e.target.value)}>
              <option value="pendiente_diseno">Pendiente diseño</option>
              <option value="en_propuesta">En propuesta</option>
              <option value="propuesta_enviada">Propuesta enviada</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="en_produccion">En producción</option>
              <option value="entregado">Entregado</option>
            </select>
            <button onClick={() => {
              const obs = prompt('Observaciones (opcional)');
              cambiarEstado(sol.id, 'rechazado', obs);
            }} className="btn-rechazar">Rechazar</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GestionSolicitudes;