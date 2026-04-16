import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL;
const BASE = `${API_URL}/api/admin/Atributosproduc`;

// ─── helpers ─────────────────────────────────────────────────────────────────
const api = {
  get:    (url)        => axios.get(url).then(r => r.data),
  post:   (url, body)  => axios.post(url, body).then(r => r.data),
  put:    (url, body)  => axios.put(url, body).then(r => r.data),
  delete: (url)        => axios.delete(url).then(r => r.data),
};

// ─── Paleta NOVA GRAF ────────────────────────────────────────────────────────
const COLORS = {
  teal2: '#35BA99',
  teal1: '#1A6163',
  black: '#000000',
  red: '#FF0000',
  white: '#FFFFFF',
  border: '#D9D9D6',
  tealLight: 'rgba(53, 186, 153, 0.12)',
  tealSoft: 'rgba(53, 186, 153, 0.08)',
  redSoft: 'rgba(255, 0, 0, 0.08)',
  textMuted: '#6B7280',
};

// ─── pequeños componentes reutilizables ───────────────────────────────────────
function Badge({ activo }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
      background: activo ? COLORS.tealLight : '#f1f5f9',
      color:      activo ? COLORS.teal1 : '#64748b',
    }}>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function Alerta({ msg, tipo, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: tipo === 'error' ? COLORS.redSoft : COLORS.tealLight,
      color:      tipo === 'error' ? COLORS.red : COLORS.teal1,
      border: `1px solid ${tipo === 'error' ? '#fecaca' : COLORS.teal2}`,
      borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 12px rgba(26,97,99,0.12)', maxWidth: 340,
    }}>
      {msg}
    </div>
  );
}

function ModalConfirm({ msg, onConfirmar, onCancelar }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000,
    }}>
      <div style={{
        background: COLORS.white, borderRadius: 14, padding: '28px 32px',
        maxWidth: 360, width: '90%', boxShadow: '0 8px 32px rgba(26,97,99,0.15)',
      }}>
        <p style={{ margin: '0 0 20px', fontSize: 15, color: COLORS.black }}>{msg}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancelar} style={btn('ghost')}>Cancelar</button>
          <button onClick={onConfirmar} style={btn('danger')}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ─── estilos con colores NOVA GRAF ────────────────────────────────────────────
const btn = (v = 'primary') => {
  const base = { border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' };
  if (v === 'primary') return { ...base, background: COLORS.teal1, color: COLORS.white, '&:hover': { background: '#0f3d3f', transform: 'translateY(-1px)' } };
  if (v === 'ghost')   return { ...base, background: COLORS.tealSoft, color: COLORS.teal1 };
  if (v === 'danger')  return { ...base, background: COLORS.redSoft, color: COLORS.red, '&:hover': { background: COLORS.red, color: COLORS.white } };
  if (v === 'icon')    return { ...base, padding: '4px 9px', fontSize: 12, background: COLORS.white, color: COLORS.teal1, border: `1px solid ${COLORS.border}` };
};

const input = { 
  width: '100%', boxSizing: 'border-box', border: `1.5px solid ${COLORS.border}`, 
  borderRadius: 8, padding: '7px 11px', fontSize: 13, color: COLORS.black, 
  outline: 'none', background: COLORS.white, transition: 'all 0.2s ease',
  ':focus': { borderColor: COLORS.teal2, boxShadow: `0 0 0 3px ${COLORS.tealLight}` }
};

const card = { 
  background: COLORS.white, border: `1px solid ${COLORS.border}`, 
  borderRadius: 14, padding: '24px 28px', marginBottom: 24,
  boxShadow: '0 2px 8px rgba(26,97,99,0.06)'
};

const th = { 
  textAlign: 'left', padding: '7px 10px', color: COLORS.teal1, 
  fontWeight: 700, fontSize: 11, textTransform: 'uppercase', 
  letterSpacing: '0.08em', borderBottom: `2px solid ${COLORS.teal2}`,
  background: COLORS.tealSoft
};

const td = { 
  padding: '9px 10px', color: COLORS.black, 
  borderBottom: `1px solid ${COLORS.border}`, verticalAlign: 'middle' 
};

// ─── tabla genérica (colores / materiales) ────────────────────────────────────
function TablaSimple({ titulo, endpoint }) {
  const [filas,    setFilas]    = useState([]);
  const [nombre,   setNombre]   = useState('');
  const [editId,   setEditId]   = useState(null);
  const [cargando, setCargando] = useState(false);
  const [alerta,   setAlerta]   = useState(null);
  const [confirm,  setConfirm]  = useState(null);

  const notif = (msg, tipo = 'ok') => setAlerta({ msg, tipo });

  const cargar = useCallback(async () => {
    try {
      const data = await api.get(`${BASE}/${endpoint}`);
      setFilas(Array.isArray(data) ? data : data.rows ?? data.data ?? []);
    } catch {
      notif('Error al cargar datos', 'error');
    }
  }, [endpoint]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!nombre.trim()) return notif('El nombre es requerido', 'error');
    setCargando(true);
    try {
      if (editId) {
        await api.put(`${BASE}/${endpoint}/${editId}`, { nombre });
        notif('Registro actualizado');
      } else {
        await api.post(`${BASE}/${endpoint}`, { nombre });
        notif('Registro creado');
      }
      setNombre(''); setEditId(null); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (fila) => { setEditId(fila.id); setNombre(fila.nombre); };
  const cancelarEdicion = () => { setEditId(null); setNombre(''); };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`${BASE}/${endpoint}/${confirm.id}`);
      notif('Registro eliminado'); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al eliminar', 'error');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      {alerta  && <Alerta msg={alerta.msg} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      {confirm && <ModalConfirm msg={confirm.msg} onConfirmar={confirmarEliminar} onCancelar={() => setConfirm(null)} />}

      <div style={card}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: COLORS.teal1 }}>{titulo}</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            style={{ ...input, flex: 1 }}
            placeholder="Nombre"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
          />
          <button style={btn('primary')} onClick={guardar} disabled={cargando}>
            {editId ? 'Actualizar' : 'Agregar'}
          </button>
          {editId && <button style={btn('ghost')} onClick={cancelarEdicion}>Cancelar</button>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 50 }}>#</th>
              <th style={th}>Nombre</th>
              <th style={{ ...th, textAlign: 'right', width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={3} style={{ ...td, textAlign: 'center', color: COLORS.textMuted }}>Sin registros</td></tr>
            )}
            {filas.map(fila => (
              <tr key={fila.id} style={{ background: editId === fila.id ? COLORS.tealSoft : 'transparent' }}>
                <td style={{ ...td, color: COLORS.textMuted }}>{fila.id}</td>
                <td style={td}>{fila.nombre}</td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button style={btn('icon')} onClick={() => iniciarEdicion(fila)}>✏️</button>{' '}
                  <button style={btn('icon')} onClick={() => setConfirm({ id: fila.id, msg: `¿Eliminar "${fila.nombre}"?` })}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── tabla tipos_atributo ─────────────────────────────────────────────────────
function TablaTiposAtributo() {
  const [filas,    setFilas]    = useState([]);
  const [form,     setForm]     = useState({ nombre: '', activo: true });
  const [editId,   setEditId]   = useState(null);
  const [cargando, setCargando] = useState(false);
  const [alerta,   setAlerta]   = useState(null);
  const [confirm,  setConfirm]  = useState(null);

  const notif  = (msg, tipo = 'ok') => setAlerta({ msg, tipo });
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cargar = useCallback(async () => {
    try {
      const data = await api.get(`${BASE}/tipos-atributo`);
      setFilas(Array.isArray(data) ? data : data.rows ?? data.data ?? []);
    } catch { notif('Error al cargar tipos de atributo', 'error'); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!form.nombre.trim()) return notif('El nombre es requerido', 'error');
    setCargando(true);
    try {
      if (editId) {
        await api.put(`${BASE}/tipos-atributo/${editId}`, form);
        notif('Tipo actualizado');
      } else {
        await api.post(`${BASE}/tipos-atributo`, form);
        notif('Tipo creado');
      }
      setForm({ nombre: '', activo: true }); setEditId(null); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion  = (fila) => { setEditId(fila.id); setForm({ nombre: fila.nombre, activo: fila.activo }); };
  const cancelarEdicion = ()     => { setEditId(null); setForm({ nombre: '', activo: true }); };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`${BASE}/tipos-atributo/${confirm.id}`);
      notif('Tipo eliminado'); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al eliminar', 'error');
    } finally { setConfirm(null); }
  };

  return (
    <>
      {alerta  && <Alerta msg={alerta.msg} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      {confirm && <ModalConfirm msg={confirm.msg} onConfirmar={confirmarEliminar} onCancelar={() => setConfirm(null)} />}

      <div style={card}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: COLORS.teal1 }}>Tipos de atributo</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            style={{ ...input, flex: 1, minWidth: 160 }}
            placeholder="Nombre"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: COLORS.teal1, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} />
            Activo
          </label>
          <button style={btn('primary')} onClick={guardar} disabled={cargando}>
            {editId ? 'Actualizar' : 'Agregar'}
          </button>
          {editId && <button style={btn('ghost')} onClick={cancelarEdicion}>Cancelar</button>}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 50 }}>#</th>
              <th style={th}>Nombre</th>
              <th style={th}>Estado</th>
              <th style={{ ...th, textAlign: 'right', width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: COLORS.textMuted }}>Sin registros</td></tr>
            )}
            {filas.map(fila => (
              <tr key={fila.id} style={{ background: editId === fila.id ? COLORS.tealSoft : 'transparent' }}>
                <td style={{ ...td, color: COLORS.textMuted }}>{fila.id}</td>
                <td style={td}>{fila.nombre}</td>
                <td style={td}><Badge activo={fila.activo} /></td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button style={btn('icon')} onClick={() => iniciarEdicion(fila)}>✏️</button>{' '}
                  <button style={btn('icon')} onClick={() => setConfirm({ id: fila.id, msg: `¿Eliminar "${fila.nombre}"?` })}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── tabla valores_atributo ───────────────────────────────────────────────────
function TablaValoresAtributo() {
  const [filas,    setFilas]    = useState([]);
  const [tipos,    setTipos]    = useState([]);
  const [form,     setForm]     = useState({ tipo_atributo_id: '', valor: '', activo: true });
  const [editId,   setEditId]   = useState(null);
  const [cargando, setCargando] = useState(false);
  const [alerta,   setAlerta]   = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [filtro,   setFiltro]   = useState('');

  const notif = (msg, tipo = 'ok') => setAlerta({ msg, tipo });
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cargar = useCallback(async () => {
    try {
      const [vals, tps] = await Promise.all([
        api.get(`${BASE}/valores-atributo`),
        api.get(`${BASE}/tipos-atributo`),
      ]);
      const norm = (d) => Array.isArray(d) ? d : d.rows ?? d.data ?? [];
      setFilas(norm(vals)); setTipos(norm(tps));
    } catch {
      notif('Error al cargar valores de atributo', 'error');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    if (!form.tipo_atributo_id) return notif('Selecciona un tipo de atributo', 'error');
    if (!form.valor.trim())     return notif('El valor es requerido', 'error');
    setCargando(true);
    try {
      if (editId) {
        await api.put(`${BASE}/valores-atributo/${editId}`, form);
        notif('Valor actualizado');
      } else {
        await api.post(`${BASE}/valores-atributo`, form);
        notif('Valor creado');
      }
      setForm({ tipo_atributo_id: '', valor: '', activo: true }); setEditId(null); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion  = (fila) => { setEditId(fila.id); setForm({ tipo_atributo_id: fila.tipo_atributo_id, valor: fila.valor, activo: fila.activo }); };
  const cancelarEdicion = ()     => { setEditId(null); setForm({ tipo_atributo_id: '', valor: '', activo: true }); };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`${BASE}/valores-atributo/${confirm.id}`);
      notif('Valor eliminado'); cargar();
    } catch (err) {
      notif(err.response?.data?.error || 'Error al eliminar', 'error');
    } finally { setConfirm(null); }
  };

  const filasFiltradas = filtro
    ? filas.filter(f => String(f.tipo_atributo_id) === filtro)
    : filas;

  return (
    <>
      {alerta  && <Alerta msg={alerta.msg} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      {confirm && <ModalConfirm msg={confirm.msg} onConfirmar={confirmarEliminar} onCancelar={() => setConfirm(null)} />}

      <div style={card}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: COLORS.teal1 }}>Valores de atributo</h2>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            style={{ ...input, width: 190 }}
            value={form.tipo_atributo_id}
            onChange={e => set('tipo_atributo_id', e.target.value)}
          >
            <option value="">— Tipo de atributo —</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <input
            style={{ ...input, flex: 1, minWidth: 140 }}
            placeholder="Valor"
            value={form.valor}
            onChange={e => set('valor', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guardar()}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: COLORS.teal1, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)} />
            Activo
          </label>
          <button style={btn('primary')} onClick={guardar} disabled={cargando}>
            {editId ? 'Actualizar' : 'Agregar'}
          </button>
          {editId && <button style={btn('ghost')} onClick={cancelarEdicion}>Cancelar</button>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>Filtrar por tipo:</span>
          <select style={{ ...input, width: 200 }} value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 50 }}>#</th>
              <th style={th}>Tipo</th>
              <th style={th}>Valor</th>
              <th style={th}>Estado</th>
              <th style={{ ...th, textAlign: 'right', width: 100 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, textAlign: 'center', color: COLORS.textMuted }}>Sin registros</td></tr>
            )}
            {filasFiltradas.map(fila => (
              <tr key={fila.id} style={{ background: editId === fila.id ? COLORS.tealSoft : 'transparent' }}>
                <td style={{ ...td, color: COLORS.textMuted }}>{fila.id}</td>
                <td style={td}>
                  <span style={{ fontSize: 12, background: COLORS.tealSoft, color: COLORS.teal1, padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                    {fila.tipo_nombre}
                  </span>
                </td>
                <td style={td}>{fila.valor}</td>
                <td style={td}><Badge activo={fila.activo} /></td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <button style={btn('icon')} onClick={() => iniciarEdicion(fila)}>✏️</button>{' '}
                  <button style={btn('icon')} onClick={() => setConfirm({ id: fila.id, msg: `¿Eliminar "${fila.valor}"?` })}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'colores',   label: 'Colores' },
  { key: 'materiales', label: 'Materiales' },
  { key: 'tipos',     label: 'Tipos atributo' },
  { key: 'valores',   label: 'Valores atributo' },
];

// ─── componente raíz ──────────────────────────────────────────────────────────
export default function AtributosProducto() {
  const [tab, setTab] = useState('colores');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.teal1, letterSpacing: '-0.5px' }}>
          Atributos de producto
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: COLORS.textMuted }}>
          Colores, materiales, tipos y valores de atributo
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: 'none', background: 'transparent',
              padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: tab === t.key ? COLORS.teal1 : COLORS.textMuted,
              borderBottom: tab === t.key ? `2px solid ${COLORS.teal2}` : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.2s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'colores'    && <TablaSimple titulo="Colores"     endpoint="colores" />}
      {tab === 'materiales' && <TablaSimple titulo="Materiales"  endpoint="materiales" />}
      {tab === 'tipos'      && <TablaTiposAtributo />}
      {tab === 'valores'    && <TablaValoresAtributo />}
    </div>
  );
}