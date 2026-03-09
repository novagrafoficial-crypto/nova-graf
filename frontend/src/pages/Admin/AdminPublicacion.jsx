// pages/admin/AdminPublicacion.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Package, Briefcase, RefreshCw } from 'lucide-react';

const API = 'http://localhost:5000'; // ← puerto correcto

const AdminPublicacion = () => {
  const [items, setItems]     = useState([]);
  const [tab, setTab]         = useState('productos');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleToggle = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: nuevoEstado } : i));
    try {
      await axios.put(`${API}/api/admin/publicar/${tab}/${id}`, { publicado: nuevoEstado });
    } catch (err) {
      // Revertir si falla
      setItems(prev => prev.map(i => i.id === id ? { ...i, publicado: estadoActual } : i));
      alert('Error al actualizar. Intenta de nuevo.');
    }
  };

  // ── Cabeceras según la pestaña ────────────────────────────────────────────
  const renderHeaders = () => {
    if (tab === 'productos') {
      return (
        <tr>
          <th>Imagen</th>
          <th>Nombre</th>
          <th>Categoría</th>
          <th>Subcategoría</th>
          <th>Marca</th>
          <th>Material</th>
          <th>Precio base</th>
          <th>Activo</th>
          <th>Estado</th>
          <th>Acción</th>
        </tr>
      );
    }
    return (
      <tr>
        <th>Imagen</th>
        <th>Descripción</th>
        <th>Producto vinculado</th>
        <th>Fecha creación</th>
        <th>Estado</th>
        <th>Acción</th>
      </tr>
    );
  };

  // ── Filas según la pestaña ────────────────────────────────────────────────
  const renderRow = (item) => {
    const badgePublicado = item.publicado
      ? <span style={styles.badgePublic}>✅ Publicado</span>
      : <span style={styles.badgeDraft}>🔒 Borrador</span>;

    const boton = (
      <button
        style={item.publicado ? styles.btnOcultar : styles.btnPublicar}
        onClick={() => handleToggle(item.id, item.publicado)}
      >
        {item.publicado ? <><EyeOff size={14}/> Ocultar</> : <><Eye size={14}/> Publicar</>}
      </button>
    );

    if (tab === 'productos') {
      return (
        <tr key={item.id} style={item.publicado ? styles.rowPublic : styles.rowDraft}>
          <td>
            <img
              src={item.imagen_url || '/placeholder.png'}
              alt={item.nombre}
              style={styles.thumb}
              onError={e => { e.target.src = '/placeholder.png'; }}
            />
          </td>
          <td><strong>{item.nombre}</strong></td>
          <td>{item.categoria    || '—'}</td>
          <td>{item.subcategoria || '—'}</td>
          <td>{item.marca        || '—'}</td>
          <td>{item.material     || '—'}</td>
          <td>${Number(item.precio_base).toLocaleString('es-MX')}</td>
          <td>{item.activo ? '✔ Activo' : '✘ Inactivo'}</td>
          <td>{badgePublicado}</td>
          <td>{boton}</td>
        </tr>
      );
    }

    // Portafolio
    return (
      <tr key={item.id} style={item.publicado ? styles.rowPublic : styles.rowDraft}>
        <td>
          <img
            src={item.imagen_url || '/placeholder.png'}
            alt="portafolio"
            style={styles.thumb}
            onError={e => { e.target.src = '/placeholder.png'; }}
          />
        </td>
        <td>{item.descripcion ? item.descripcion.substring(0, 60) + '…' : '—'}</td>
        <td>{item.producto_nombre || '—'}</td>
        <td>{item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString('es-MX') : '—'}</td>
        <td>{badgePublicado}</td>
        <td>{boton}</td>
      </tr>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Visibilidad Pública</h1>
        <p style={styles.subtitle}>Controla qué elementos se muestran en el Home.</p>
      </div>

      {/* Pestañas */}
      <div style={styles.tabs}>
        <button
          style={tab === 'productos' ? styles.tabActive : styles.tab}
          onClick={() => setTab('productos')}
        >
          <Package size={18}/> Productos
        </button>
        <button
          style={tab === 'portafolio' ? styles.tabActive : styles.tab}
          onClick={() => setTab('portafolio')}
        >
          <Briefcase size={18}/> Portafolio
        </button>
        <button style={styles.tabRefresh} onClick={fetchData} title="Recargar">
          <RefreshCw size={16}/>
        </button>
      </div>

      {/* Estados */}
      {error   && <div style={styles.errorBox}>{error}</div>}
      {loading && <div style={styles.loader}>Cargando…</div>}

      {!loading && !error && (
        <>
          <p style={styles.counter}>
            {items.filter(i => i.publicado).length} publicados de {items.length} totales
          </p>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead style={styles.thead}>{renderHeaders()}</thead>
              <tbody>
                {items.length === 0
                  ? <tr><td colSpan={10} style={styles.empty}>Sin registros</td></tr>
                  : items.map(renderRow)
                }
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ── Estilos inline básicos ────────────────────────────────────────────────────
const styles = {
  container:   { padding: '24px', fontFamily: 'sans-serif', maxWidth: '100%' },
  header:      { marginBottom: 24 },
  title:       { fontSize: 22, fontWeight: 700, margin: 0 },
  subtitle:    { color: '#666', marginTop: 4 },
  tabs:        { display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' },
  tab:         { padding: '8px 16px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive:   { padding: '8px 16px', border: '2px solid #2563eb', borderRadius: 6, cursor: 'pointer', background: '#eff6ff', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  tabRefresh:  { marginLeft: 'auto', padding: '8px', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', background: '#fff' },
  tableWrap:   { overflowX: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead:       { background: '#f1f5f9' },
  thumb:       { width: 56, height: 56, objectFit: 'cover', borderRadius: 6 },
  rowPublic:   { background: '#f0fdf4' },
  rowDraft:    { background: '#fff' },
  badgePublic: { background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 },
  badgeDraft:  { background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 12, fontSize: 12 },
  btnPublicar: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  btnOcultar:  { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  counter:     { color: '#555', fontSize: 13, marginBottom: 8 },
  loader:      { textAlign: 'center', padding: 40, color: '#888' },
  errorBox:    { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 },
  empty:       { textAlign: 'center', padding: 32, color: '#aaa' },
};

export default AdminPublicacion;