import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Package, Briefcase, RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ModalConfirmacion = ({ visible, tipo, entidad, onConfirmar, onCancelar }) => {
  if (!visible) return null;
  const esPublicar = tipo === 'publicar';
  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.card}>
        <div style={{ ...modalStyles.iconWrap, background: esPublicar ? '#e0f5f0' : '#fee2e2' }}>
          {esPublicar ? <Eye size={28} color="#1A6163" /> : <EyeOff size={28} color="#dc2626" />}
        </div>
        <h2 style={modalStyles.titulo}>{esPublicar ? `Publicar ${entidad}` : `Ocultar ${entidad}`}</h2>
        <p style={modalStyles.mensaje}>
          {esPublicar
            ? `Este ${entidad} será visible para todos los clientes en el sitio.`
            : `Este ${entidad} dejará de ser visible para los clientes.`}
        </p>
        <div style={{ ...modalStyles.aviso, background: esPublicar ? '#f0fdf9' : '#fff7ed', border: `1px solid ${esPublicar ? '#a7f3d0' : '#fed7aa'}` }}>
          <AlertTriangle size={14} color={esPublicar ? '#1A6163' : '#ea580c'} style={{ flexShrink: 0 }} />
          <span style={{ color: esPublicar ? '#1A6163' : '#9a3412', fontSize: '13px' }}>
            {esPublicar ? 'Podrás ocultarlo en cualquier momento.' : 'Podrás volver a publicarlo cuando quieras.'}
          </span>
        </div>
        <div style={modalStyles.botones}>
          <button style={modalStyles.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={esPublicar ? modalStyles.btnConfirmarPublicar : modalStyles.btnConfirmarOcultar} onClick={onConfirmar}>
            {esPublicar ? <><Eye size={15} /> Sí, publicar</> : <><EyeOff size={15} /> Sí, ocultar</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const Paginacion = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...'); pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1); pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1); pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...'); pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div style={paginationStyles.container}>
      <button style={{ ...paginationStyles.button, ...(currentPage === 1 && paginationStyles.disabled) }} onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft size={16} /> Anterior
      </button>
      <div style={paginationStyles.pages}>
        {getPageNumbers().map((page, index) => (
          page === '...'
            ? <span key={index} style={paginationStyles.dots}>...</span>
            : <button key={index} style={{ ...paginationStyles.pageButton, ...(currentPage === page && paginationStyles.activePage) }} onClick={() => onPageChange(page)}>{page}</button>
        ))}
      </div>
      <button style={{ ...paginationStyles.button, ...(currentPage === totalPages && paginationStyles.disabled) }} onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Siguiente <ChevronRight size={16} />
      </button>
    </div>
  );
};

const AdminPublicacion = () => {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('productos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [modal, setModal] = useState({ visible: false, id: null, estadoActual: null, tipo: null, entidad: null });

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API}/api/admin/listado/${tab}`);
      setItems(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError('No se pudieron cargar los datos. Verifica la conexión.');
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchData(); }, [tab, fetchData]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const handlePageChange = (pageNumber) => { setCurrentPage(pageNumber); };

  const handleToggle = (id, estadoActual) => {
    setModal({ visible: true, id, estadoActual, tipo: estadoActual ? 'ocultar' : 'publicar', entidad: tab === 'productos' ? 'producto' : 'elemento del portafolio' });
  };

  const handleConfirmar = async () => {
    const { id, estadoActual } = modal;
    const nuevoEstado = !estadoActual;
    setModal(m => ({ ...m, visible: false }));
    setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: nuevoEstado } : i));
    try {
      await axios.put(`${API}/api/admin/publicar/${tab}/${id}`, { publicado: nuevoEstado });
    } catch {
      setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: estadoActual } : i));
      setError('Error al actualizar. Intenta de nuevo.');
    }
  };

  const renderHeaders = () => {
    if (tab === 'productos') {
      return (
        <tr>
          {["Imagen","Nombre","Categoría","Subcategoría","Marca","Material","Precio base","Activo","Estado","Acción"].map(h => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      );
    }
    return (
      <tr>
        {["Imagen","Descripción","Producto vinculado","Fecha creación","Estado","Acción"].map(h => (
          <th key={h} style={styles.th}>{h}</th>
        ))}
      </tr>
    );
  };

  const renderRow = (item) => {
    const badgePublicado = item.publicado
      ? <span style={{ ...styles.badge, ...styles.badgePublic }}><CheckCircle size={12} style={{ marginRight: 4 }} /> Publicado</span>
      : <span style={{ ...styles.badge, ...styles.badgeDraft }}><XCircle size={12} style={{ marginRight: 4 }} /> Borrador</span>;

    const boton = (
      <button style={item.publicado ? styles.btnOcultar : styles.btnPublicar} onClick={() => handleToggle(item.id, item.publicado)} className="action-btn">
        {item.publicado ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Publicar</>}
      </button>
    );

    if (tab === 'productos') {
      return (
        <tr key={item.id} style={styles.row}>
          <td style={styles.td}><img src={item.imagen_url || '/placeholder.png'} alt={item.nombre} style={styles.thumb} onError={e => { e.target.src = '/placeholder.png'; }} /></td>
          <td style={{ ...styles.td, fontWeight: 600 }}>{item.nombre}</td>
          <td style={styles.td}>{item.categoria || '—'}</td>
          <td style={styles.td}>{item.subcategoria || '—'}</td>
          <td style={styles.td}>{item.marca || '—'}</td>
          <td style={styles.td}>{item.material || '—'}</td>
          <td style={{ ...styles.td, fontWeight: 600, color: '#1A6163' }}>${Number(item.precio_base).toLocaleString('es-MX')}</td>
          <td style={styles.td}>{item.activo ? <span style={{ color: '#0F6E56', fontWeight: 500 }}>✔ Activo</span> : <span style={{ color: '#999' }}>✘ Inactivo</span>}</td>
          <td style={styles.td}>{badgePublicado}</td>
          <td style={styles.td}>{boton}</td>
        </tr>
      );
    }

    return (
      <tr key={item.id} style={styles.row}>
        <td style={styles.td}><img src={item.imagen_url || '/placeholder.png'} alt="portafolio" style={styles.thumb} onError={e => { e.target.src = '/placeholder.png'; }} /></td>
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
      <ModalConfirmacion visible={modal.visible} tipo={modal.tipo} entidad={modal.entidad} onConfirmar={handleConfirmar} onCancelar={() => setModal(m => ({ ...m, visible: false }))} />

      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Publicaciones</h1>
        <p style={styles.subtitle}>Administra qué productos y portafolio son visibles al público</p>
      </div>

      <div style={styles.tabBar}>
        <div style={styles.tabs}>
          <button style={tab === 'productos' ? { ...styles.tab, ...styles.tabActive } : styles.tab} onClick={() => setTab('productos')}>
            <Package size={18} /><span>Productos</span>
          </button>
          <button style={tab === 'portafolio' ? { ...styles.tab, ...styles.tabActive } : styles.tab} onClick={() => setTab('portafolio')}>
            <Briefcase size={18} /><span>Portafolio</span>
          </button>
        </div>
        <button style={styles.refreshBtn} onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} style={loading ? styles.spinning : {}} /><span>Actualizar</span>
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
            <span style={styles.statItem}><strong style={{ color: "#1A6163" }}>{items.filter(i => i.publicado).length}</strong> publicados</span>
            <span style={styles.statItem}><strong>{items.length}</strong> totales</span>
            <span style={styles.statItem}>Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, items.length)} de {items.length}</span>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>{renderHeaders()}</thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr><td colSpan={tab === 'productos' ? 10 : 6} style={styles.emptyMessage}>No hay registros para mostrar</td></tr>
                ) : currentItems.map(renderRow)}
              </tbody>
            </table>
          </div>

          <Paginacion currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '1.5rem', fontFamily: '"DM Sans", system-ui, sans-serif', backgroundColor: '#f4fdfb', minHeight: '100vh' },
  header: { marginBottom: '1.5rem' },
  title: { fontSize: '22px', fontWeight: 500, color: '#1A6163', margin: 0 },
  subtitle: { fontSize: '14px', color: '#999', marginTop: '4px' },
  tabBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' },
  tabs: { display: 'flex', gap: '4px', backgroundColor: '#f0fafa', padding: '4px', borderRadius: '10px' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', border: 'none', borderRadius: '8px', background: 'transparent', color: '#666', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  tabActive: { background: '#1A6163', color: '#fff', fontWeight: 600 },
  refreshBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fff', border: '1.5px solid #d4eeea', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: '#1A6163', cursor: 'pointer' },
  spinning: { animation: 'spin 1s linear infinite' },
  stats: { display: 'flex', gap: '24px', marginBottom: '1rem', padding: '10px 16px', background: '#fff', borderRadius: '10px', border: '1px solid #d4eeea', fontSize: '13px', color: '#333' },
  statItem: { fontSize: '13px', color: '#555' },
  tableWrapper: { background: '#fff', borderRadius: '12px', border: '1px solid #d4eeea', overflow: 'auto', maxWidth: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '900px' },
  thead: { background: '#1A6163' },
  th: { padding: '12px 14px', textAlign: 'left', fontWeight: 600, color: '#fff', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', borderBottom: '1px solid #e0f0ee', color: '#333', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  row: { background: '#fff', transition: 'background 0.15s' },
  thumb: { width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e0f0ee', background: '#f4fdfb' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' },
  badgePublic: { background: '#d4f5eb', color: '#0F6E56', border: '1px solid #a7f3d0' },
  badgeDraft: { background: '#ffd6d6', color: '#8b0000', border: '1px solid #fecaca' },
  btnPublicar: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#35BA99', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 4px rgba(53,186,153,0.3)' },
  btnOcultar: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#ffd6d6', color: '#8b0000', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer' },
  errorBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffd6d6', color: '#8b0000', padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #fecaca', fontSize: '13px' },
  errorClose: { background: 'transparent', border: 'none', color: '#8b0000', fontSize: '16px', cursor: 'pointer' },
  loader: { textAlign: 'center', padding: '3rem', color: '#999', background: '#fff', borderRadius: '12px', border: '1px solid #d4eeea' },
  emptyMessage: { textAlign: 'center', padding: '3rem', color: '#999', fontSize: '14px' },
};

const paginationStyles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '1rem', padding: '1rem', flexWrap: 'wrap' },
  button: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#fff', border: '1.5px solid #d4eeea', borderRadius: '8px', color: '#1A6163', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  disabled: { opacity: 0.5, cursor: 'not-allowed' },
  pages: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  pageButton: { minWidth: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', border: '1.5px solid #d4eeea', borderRadius: '8px', color: '#1A6163', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  activePage: { backgroundColor: '#1A6163', borderColor: '#1A6163', color: '#fff' },
  dots: { padding: '0 4px', color: '#999' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  card: { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' },
  iconWrap: { width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: '18px', fontWeight: 700, color: '#1A6163', margin: 0, textAlign: 'center' },
  mensaje: { fontSize: '14px', color: '#555', margin: 0, textAlign: 'center', lineHeight: 1.6 },
  aviso: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', width: '100%', boxSizing: 'border-box' },
  botones: { display: 'flex', gap: '10px', width: '100%', marginTop: '6px' },
  btnCancelar: { flex: 1, padding: '10px 0', background: '#f0fafa', color: '#1A6163', border: '1.5px solid #d4eeea', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  btnConfirmarPublicar: { flex: 1, padding: '10px 0', background: '#35BA99', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(53,186,153,0.3)' },
  btnConfirmarOcultar: { flex: 1, padding: '10px 0', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(220,53,69,0.3)' },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .action-btn:hover { filter: brightness(0.9); }
  tbody tr:hover { background: #f4fdfb !important; }
`;
document.head.appendChild(styleSheet);

export default AdminPublicacion;