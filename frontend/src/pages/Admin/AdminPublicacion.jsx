import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Package, Briefcase, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── MODAL DE CONFIRMACIÓN ───────────────────────────────────────────────────
const ModalConfirmacion = ({ visible, tipo, entidad, onConfirmar, onCancelar }) => {
  if (!visible) return null;

  const esPublicar = tipo === 'publicar';

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>

        {/* Ícono */}
        <div style={{
          ...modalStyles.iconWrap,
          background: esPublicar ? '#dbeafe' : '#fee2e2',
        }}>
          {esPublicar
            ? <Eye size={28} color="#2563eb" />
            : <EyeOff size={28} color="#dc2626" />
          }
        </div>

        {/* Título */}
        <h2 style={modalStyles.titulo}>
          {esPublicar ? `Publicar ${entidad}` : `Ocultar ${entidad}`}
        </h2>

        {/* Mensaje */}
        <p style={modalStyles.mensaje}>
          {esPublicar
            ? `Este ${entidad} será visible para todos los clientes en el sitio.`
            : `Este ${entidad} dejará de ser visible para los clientes.`
          }
        </p>

        {/* Aviso */}
        <div style={{
          ...modalStyles.aviso,
          background: esPublicar ? '#eff6ff' : '#fff7ed',
          border: `1px solid ${esPublicar ? '#bfdbfe' : '#fed7aa'}`,
        }}>
          <AlertTriangle size={14} color={esPublicar ? '#2563eb' : '#ea580c'} style={{ flexShrink: 0 }} />
          <span style={{ color: esPublicar ? '#1e40af' : '#9a3412', fontSize: '13px' }}>
            {esPublicar
              ? 'Podrás ocultarlo en cualquier momento.'
              : 'Podrás volver a publicarlo cuando quieras.'
            }
          </span>
        </div>

        {/* Botones */}
        <div style={modalStyles.botones}>
          <button style={modalStyles.btnCancelar} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            style={esPublicar ? modalStyles.btnConfirmarPublicar : modalStyles.btnConfirmarOcultar}
            onClick={onConfirmar}
          >
            {esPublicar
              ? <><Eye size={15} /> Sí, publicar</>
              : <><EyeOff size={15} /> Sí, ocultar</>
            }
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
const AdminPublicacion = () => {
  const [items, setItems]     = useState([]);
  const [tab, setTab]         = useState('productos');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [modal, setModal] = useState({
    visible: false,
    id: null,
    estadoActual: null,
    tipo: null,
    entidad: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/api/admin/listado/${tab}`);
      setItems(res.data);
    } catch (err) {
      setError('No se pudieron cargar los datos. Verifica la conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchData(); }, [tab, fetchData]);

  // Abre el modal con la info del item
  const handleToggle = (id, estadoActual) => {
    setModal({
      visible: true,
      id,
      estadoActual,
      tipo: estadoActual ? 'ocultar' : 'publicar',
      entidad: tab === 'productos' ? 'producto' : 'elemento del portafolio',
    });
  };

  // Confirmar — ejecuta el cambio
  const handleConfirmar = async () => {
    const { id, estadoActual } = modal;
    const nuevoEstado = !estadoActual;
    setModal(m => ({ ...m, visible: false }));
    setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: nuevoEstado } : i));
    try {
      await axios.put(`${API}/api/admin/publicar/${tab}/${id}`, { publicado: nuevoEstado });
    } catch (err) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: estadoActual } : i));
      setError('Error al actualizar. Intenta de nuevo.');
    }
  };

  // Cancelar — cierra sin hacer nada
  const handleCancelar = () => {
    setModal(m => ({ ...m, visible: false }));
  };

  const renderHeaders = () => {
    if (tab === 'productos') {
      return (
        <tr>
          <th style={styles.th}>Imagen</th>
          <th style={styles.th}>Nombre</th>
          <th style={styles.th}>Categoría</th>
          <th style={styles.th}>Subcategoría</th>
          <th style={styles.th}>Marca</th>
          <th style={styles.th}>Material</th>
          <th style={styles.th}>Precio base</th>
          <th style={styles.th}>Activo</th>
          <th style={styles.th}>Estado</th>
          <th style={styles.th}>Acción</th>
        </tr>
      );
    }
    return (
      <tr>
        <th style={styles.th}>Imagen</th>
        <th style={styles.th}>Descripción</th>
        <th style={styles.th}>Producto vinculado</th>
        <th style={styles.th}>Fecha creación</th>
        <th style={styles.th}>Estado</th>
        <th style={styles.th}>Acción</th>
      </tr>
    );
  };

  const renderRow = (item) => {
    const badgePublicado = item.publicado
      ? <span style={{...styles.badge, ...styles.badgePublic}}><CheckCircle size={12} style={{marginRight: 4}} /> Publicado</span>
      : <span style={{...styles.badge, ...styles.badgeDraft}}><XCircle size={12} style={{marginRight: 4}} /> Borrador</span>;

    const boton = (
      <button
        style={item.publicado ? styles.btnOcultar : styles.btnPublicar}
        onClick={() => handleToggle(item.id, item.publicado)}
        className="action-btn"
      >
        {item.publicado ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Publicar</>}
      </button>
    );

    if (tab === 'productos') {
      return (
        <tr key={item.id} style={item.publicado ? styles.rowPublic : styles.rowDraft}>
          <td style={styles.td}>
            <img src={item.imagen_url || '/placeholder.png'} alt={item.nombre}
              style={styles.thumb} onError={e => { e.target.src = '/placeholder.png'; }} />
          </td>
          <td style={styles.td}><strong>{item.nombre}</strong></td>
          <td style={styles.td}>{item.categoria || '—'}</td>
          <td style={styles.td}>{item.subcategoria || '—'}</td>
          <td style={styles.td}>{item.marca || '—'}</td>
          <td style={styles.td}>{item.material || '—'}</td>
          <td style={styles.td}>${Number(item.precio_base).toLocaleString('es-MX')}</td>
          <td style={styles.td}>{item.activo ? '✔ Activo' : '✘ Inactivo'}</td>
          <td style={styles.td}>{badgePublicado}</td>
          <td style={styles.td}>{boton}</td>
        </tr>
      );
    }

    return (
      <tr key={item.id} style={item.publicado ? styles.rowPublic : styles.rowDraft}>
        <td style={styles.td}>
          <img src={item.imagen_url || '/placeholder.png'} alt="portafolio"
            style={styles.thumb} onError={e => { e.target.src = '/placeholder.png'; }} />
        </td>
        <td style={styles.td}>{item.descripcion ? item.descripcion.substring(0, 60) + '…' : '—'}</td>
        <td style={styles.td}>{item.producto_nombre || '—'}</td>
        <td style={styles.td}>{item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-MX') : '—'}</td>
        <td style={styles.td}>{badgePublicado}</td>
        <td style={styles.td}>{boton}</td>
      </tr>
    );
  };

  return (
    <div style={styles.container}>

      <ModalConfirmacion
        visible={modal.visible}
        tipo={modal.tipo}
        entidad={modal.entidad}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
      />

      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Publicaciones</h1>
        <p style={styles.subtitle}>Administra qué productos y portafolio son visibles al público</p>
      </div>

      <div style={styles.tabBar}>
        <div style={styles.tabs}>
          <button
            style={tab === 'productos' ? {...styles.tab, ...styles.tabActive} : styles.tab}
            onClick={() => setTab('productos')}
          >
            <Package size={18} />
            <span>Productos</span>
          </button>
          <button
            style={tab === 'portafolio' ? {...styles.tab, ...styles.tabActive} : styles.tab}
            onClick={() => setTab('portafolio')}
          >
            <Briefcase size={18} />
            <span>Portafolio</span>
          </button>
        </div>
        <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} style={loading ? styles.spinning : {}} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          {error}
          <button style={styles.errorClose} onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div style={styles.loader}>Cargando datos...</div>
      ) : (
        <>
          <div style={styles.stats}>
            <span style={styles.statItem}>
              <strong>{items.filter(i => i.publicado).length}</strong> publicados
            </span>
            <span style={styles.statItem}>
              <strong>{items.length}</strong> totales
            </span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>{renderHeaders()}</thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={tab === 'productos' ? 10 : 6} style={styles.emptyMessage}>
                      No hay registros para mostrar
                    </td>
                  </tr>
                ) : (
                  items.map(renderRow)
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── ESTILOS TABLA ───────────────────────────────────────────────────────────
const styles = {
  container: {
    maxWidth: '1400px', margin: '0 auto', padding: '32px 24px',
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc', minHeight: '100vh',
  },
  header: { marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 600, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
  subtitle: { fontSize: '16px', color: '#475569', marginTop: '8px' },
  tabBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
  },
  tabs: {
    display: 'flex', gap: '8px', backgroundColor: '#ffffff',
    padding: '4px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    border: 'none', borderRadius: '10px', background: 'transparent',
    color: '#64748b', fontSize: '15px', fontWeight: 500, cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabActive: { background: '#e2e8f0', color: '#0f172a', fontWeight: 600, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' },
  refreshBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
    background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', fontWeight: 500, color: '#334155', cursor: 'pointer',
    transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  spinning: { animation: 'spin 1s linear infinite' },
  stats: {
    display: 'flex', gap: '24px', marginBottom: '20px', padding: '12px 16px',
    background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    border: '1px solid #e9eef2',
  },
  statItem: { fontSize: '15px', color: '#1e293b' },
  tableWrapper: {
    background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e9eef2', overflow: 'auto', maxWidth: '100%',
  },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '14px', minWidth: '1000px' },
  thead: { background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' },
  th: {
    padding: '16px 12px', textAlign: 'left', fontWeight: 600, color: '#334155',
    fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap',
  },
  td: { padding: '16px 12px', borderBottom: '1px solid #e9eef2', color: '#1e293b', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  rowPublic: { background: '#ffffff', transition: 'background 0.2s' },
  rowDraft:  { background: '#ffffff' },
  thumb: { width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap' },
  badgePublic: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  badgeDraft:  { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  btnPublicar: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
    background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '30px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s', boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
  },
  btnOcultar: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
    background: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '30px',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s', boxShadow: '0 2px 4px rgba(220,38,38,0.2)',
  },
  errorBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fee2e2', color: '#991b1b', padding: '16px 20px',
    borderRadius: '12px', marginBottom: '24px', border: '1px solid #fecaca', fontSize: '15px',
  },
  errorClose: { background: 'transparent', border: 'none', color: '#991b1b', fontSize: '16px', cursor: 'pointer', padding: '0 4px' },
  loader: { textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e9eef2' },
  emptyMessage: { textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '15px', fontStyle: 'italic' },
};

// ─── ESTILOS MODAL ───────────────────────────────────────────────────────────
const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.15s ease',
  },
  card: {
    background: '#ffffff', borderRadius: '20px', padding: '36px 32px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    animation: 'slideUp 0.2s ease',
  },
  iconWrap: {
    width: '64px', height: '64px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  titulo: { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0, textAlign: 'center' },
  mensaje: { fontSize: '15px', color: '#475569', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  aviso: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 14px', borderRadius: '10px',
    width: '100%', boxSizing: 'border-box',
  },
  botones: { display: 'flex', gap: '12px', width: '100%', marginTop: '8px' },
  btnCancelar: {
    flex: 1, padding: '11px 0', background: '#f1f5f9', color: '#334155',
    border: '1px solid #e2e8f0', borderRadius: '12px',
    fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
  },
  btnConfirmarPublicar: {
    flex: 1, padding: '11px 0', background: '#2563eb', color: '#ffffff',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)', transition: 'background 0.2s',
  },
  btnConfirmarOcultar: {
    flex: 1, padding: '11px 0', background: '#dc2626', color: '#ffffff',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    boxShadow: '0 4px 12px rgba(220,38,38,0.3)', transition: 'background 0.2s',
  },
};

// ─── ANIMACIONES GLOBALES ────────────────────────────────────────────────────
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .action-btn:hover { filter: brightness(0.92); }
`;
document.head.appendChild(styleSheet);

export default AdminPublicacion;