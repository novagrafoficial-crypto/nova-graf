import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/ProductoPersonalizado.css';

const API_URL = import.meta.env.VITE_API_URL;
const API_BORRADORES = `${API_URL}/api/client/borradores`;
const API_CARRITO    = `${API_URL}/api/client/carrito`;
const API_PRODUCTOS_PERS = `${API_URL}/api/client/productos/personalizados`;

const FONTS = [
  'Arial', 'Verdana', 'Georgia', 'Times New Roman',
  'Poppins', 'Montserrat', 'Pacifico', 'Lobster',
  'Bebas Neue', 'Oswald', 'Playfair Display', 'Dancing Script',
];

const TEXT_COLORS = [
  '#ffffff','#000000','#e63946','#2563eb',
  '#16a34a','#f59e0b','#ec4899','#f97316','#06b6d4','#d946ef',
];

let nextId = 1;

// ─── ÍCONOS SVG INLINE ───────────────────────────────────────────────────────
const IconGuardar  = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const IconCarrito  = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);
const IconCancelar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);
const IconCheck    = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconError    = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconInfo     = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

// ─── CONFIGURACIÓN DE MODALES ────────────────────────────────────────────────
const MODALES = {
  guardar: {
    iconoBg: '#dcfce7', iconoColor: '#16a34a', Icono: IconGuardar,
    titulo: (esEdicion) => esEdicion ? 'Actualizar diseño' : 'Guardar diseño',
    mensaje: (esEdicion) => esEdicion
      ? 'Se actualizará tu diseño guardado con los cambios actuales.'
      : 'Tu diseño se guardará en "Mis diseños" y podrás editarlo cuando quieras.',
    aviso: (esEdicion) => esEdicion
      ? 'El diseño anterior será reemplazado.'
      : 'No se agregará al carrito todavía.',
    avisoBg: '#f0fdf4', avisoBorder: '#bbf7d0', avisoColor: '#166534',
    confirmBg: '#16a34a', confirmShadow: 'rgba(22,163,74,0.3)',
    confirmLabel: (esEdicion) => esEdicion ? 'Sí, actualizar' : 'Sí, guardar',
  },
  carrito: {
    iconoBg: '#dbeafe', iconoColor: '#2563eb', Icono: IconCarrito,
    titulo: () => 'Agregar al carrito',
    mensaje: () => 'Se añadirá este producto con tu diseño personalizado al carrito de compras.',
    aviso: () => 'Podrás ajustar la cantidad desde el carrito.',
    avisoBg: '#eff6ff', avisoBorder: '#bfdbfe', avisoColor: '#1e40af',
    confirmBg: '#2563eb', confirmShadow: 'rgba(37,99,235,0.3)',
    confirmLabel: () => 'Agregar al carrito',
  },
  cancelar: {
    iconoBg: '#fef9c3', iconoColor: '#ca8a04', Icono: IconCancelar,
    titulo: () => 'Salir sin guardar',
    mensaje: () => 'Si sales ahora perderás todos los cambios que no hayas guardado en tu diseño.',
    aviso: () => 'Guarda primero si no quieres perder tu trabajo.',
    avisoBg: '#fffbeb', avisoBorder: '#fde68a', avisoColor: '#92400e',
    confirmBg: '#d97706', confirmShadow: 'rgba(217,119,6,0.3)',
    confirmLabel: () => 'Salir sin guardar',
  },
};

// ─── MODAL DE CONFIRMACIÓN ───────────────────────────────────────────────────
const ModalConfirmacion = ({ visible, tipo, esEdicion, onConfirmar, onCancelar }) => {
  if (!visible || !tipo) return null;
  const v = MODALES[tipo];
  const { Icono } = v;

  return (
    <div style={ms.overlay} onClick={onCancelar}>
      <div style={ms.card} onClick={e => e.stopPropagation()}>

        <div style={{ ...ms.iconWrap, background: v.iconoBg, color: v.iconoColor }}>
          <Icono />
        </div>

        <h2 style={ms.titulo}>{v.titulo(esEdicion)}</h2>
        <p style={ms.mensaje}>{v.mensaje(esEdicion)}</p>

        <div style={{ ...ms.aviso, background: v.avisoBg, border: `1px solid ${v.avisoBorder}` }}>
          <span style={{ color: v.avisoColor, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <IconInfo /> {v.aviso(esEdicion)}
          </span>
        </div>

        <div style={ms.botones}>
          <button style={ms.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button
            style={{ ...ms.btnConfirmar, background: v.confirmBg, boxShadow: `0 4px 14px ${v.confirmShadow}` }}
            onClick={onConfirmar}
          >
            {v.confirmLabel(esEdicion)}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL DE RESULTADO (éxito / error) ─────────────────────────────────────
const ModalResultado = ({ visible, tipo, titulo, mensaje, onCerrar }) => {
  if (!visible) return null;

  const esExito = tipo === 'exito';
  const cfg = esExito
    ? { iconoBg: '#dcfce7', iconoColor: '#16a34a', Icono: IconCheck,  btnBg: '#16a34a', btnShadow: 'rgba(22,163,74,0.3)' }
    : { iconoBg: '#fee2e2', iconoColor: '#dc2626', Icono: IconError, btnBg: '#dc2626', btnShadow: 'rgba(220,38,38,0.3)' };

  const { Icono } = cfg;

  return (
    <div style={ms.overlay} onClick={onCerrar}>
      <div style={ms.card} onClick={e => e.stopPropagation()}>

        <div style={{ ...ms.iconWrap, background: cfg.iconoBg, color: cfg.iconoColor }}>
          <Icono />
        </div>

        <h2 style={ms.titulo}>{titulo}</h2>
        <p style={ms.mensaje}>{mensaje}</p>

        <div style={{ width: '100%', marginTop: 8 }}>
          <button
            style={{ ...ms.btnConfirmar, background: cfg.btnBg, boxShadow: `0 4px 14px ${cfg.btnShadow}`, width: '100%' }}
            onClick={onCerrar}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ESTILOS MODALES ─────────────────────────────────────────────────────────
const ms = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(5px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    animation: 'mFadeIn .15s ease',
  },
  card: {
    background: '#ffffff', borderRadius: 20,
    padding: '36px 32px', width: '100%', maxWidth: 400,
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    animation: 'mSlideUp .2s ease',
    fontFamily: '"Inter", system-ui, sans-serif',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, textAlign: 'center' },
  mensaje: { fontSize: 15, color: '#475569', margin: 0, textAlign: 'center', lineHeight: 1.65 },
  aviso: {
    padding: '10px 14px', borderRadius: 10,
    width: '100%', boxSizing: 'border-box',
  },
  botones: { display: 'flex', gap: 12, width: '100%', marginTop: 8 },
  btnCancelar: {
    flex: 1, padding: '11px 0',
    background: '#f1f5f9', color: '#334155',
    border: '1px solid #e2e8f0', borderRadius: 12,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  btnConfirmar: {
    flex: 1, padding: '11px 0',
    color: '#ffffff', border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
};

// Animaciones — inyectadas una sola vez
if (!document.getElementById('modal-pers-keyframes')) {
  const st = document.createElement('style');
  st.id = 'modal-pers-keyframes';
  st.textContent = `
    @keyframes mFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes mSlideUp { from { opacity:0; transform:translateY(18px) scale(.96) }
                          to   { opacity:1; transform:translateY(0)      scale(1)  } }
  `;
  document.head.appendChild(st);
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
const ProductoPersonalizador = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { imagenProducto, productoId, variante, borradorId, elementosGuardados } = location.state || {};

  const [elementos,      setElementos]  = useState([]);
  const [seleccionado,   setSelec]      = useState(null);
  const [textoInput,     setTextoInput] = useState('');
  const [colorTexto,     setColor]      = useState('#ffffff');
  const [fontSize,       setFontSize]   = useState(32);
  const [fontFamily,     setFontFamily] = useState('Poppins');
  const [fontWeight,     setFontWeight] = useState('bold');
  const [fontStyle,      setFontStyle]  = useState('normal');
  const [textDecoration, setTextDeco]   = useState('none');
  const [textAlign,      setTextAlign]  = useState('center');
  const [shadowBlur,     setShadow]     = useState(4);
  const [guardando,      setGuardando]  = useState(false);
  const [tab,            setTab]        = useState('texto');
  const [imgError,       setImgError]   = useState(false);
  const [imgSrc,         setImgSrc]     = useState(null);
  const [editandoBorradorId] = useState(borradorId || null);

  // ── Estado de modales ──
  const [modalConfirm, setModalConfirm] = useState({ visible: false, tipo: null });
  const [modalResult,  setModalResult]  = useState({ visible: false, tipo: null, titulo: '', mensaje: '', onCerrar: null });

  const escenaRef = useRef(null);
  const fileRef   = useRef(null);

  const [dragging,  setDragging]  = useState(null);
  const [resizing,  setResizing]  = useState(null);
  const dragStartPos    = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const resizeStart     = useRef({ x: 0, y: 0, w: 0, h: 0 });

  // ── Helpers ──
  const getFullImageUrl = useCallback((url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${API_URL}${url}`;
  }, []);

  const mostrarResultado = (tipo, titulo, mensaje, onCerrar) =>
    setModalResult({ visible: true, tipo, titulo, mensaje, onCerrar: onCerrar || (() => setModalResult(r => ({ ...r, visible: false }))) });

  // ── Efectos ──
  useEffect(() => {
    if (!imagenProducto) { setImgError(true); return; }
    const fullUrl = getFullImageUrl(imagenProducto);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => setImgSrc(fullUrl);
    img.onerror = () => { setImgError(true); };
    img.src = fullUrl;
  }, [imagenProducto, getFullImageUrl]);

  useEffect(() => {
    if (borradorId && elementosGuardados) {
      const maxId = elementosGuardados.reduce((m, el) => Math.max(m, parseInt(el.id) || 0), 0);
      nextId = maxId + 1;
      setElementos(elementosGuardados);
    }
  }, [borradorId, elementosGuardados]);

  useEffect(() => {
    if (!seleccionado) return;
    const el = elementos.find(e => e.id === seleccionado);
    if (!el || el.tipo !== 'texto') return;
    setColor(el.color); setFontSize(el.fontSize);
    setFontFamily(el.fontFamily || 'Poppins');
    setFontWeight(el.fontWeight || 'bold');
    setFontStyle(el.fontStyle || 'normal');
    setTextDeco(el.textDecoration || 'none');
    setTextAlign(el.textAlign || 'center');
    setShadow(el.shadowBlur || 4);
  }, [seleccionado]);

  useEffect(() => {
    if (!seleccionado) return;
    const el = elementos.find(e => e.id === seleccionado);
    if (!el || el.tipo !== 'texto') return;
    const cambio =
      el.color !== colorTexto || el.fontSize !== fontSize ||
      el.fontFamily !== fontFamily || el.fontWeight !== fontWeight ||
      el.fontStyle !== fontStyle || el.textDecoration !== textDecoration ||
      el.textAlign !== textAlign || el.shadowBlur !== shadowBlur;
    if (cambio) actualizarEl(seleccionado, { color: colorTexto, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur });
  }, [colorTexto, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur, seleccionado]);

  // ── Elementos ──
  const actualizarEl = (id, cambios) =>
    setElementos(prev => prev.map(el => el.id === id ? { ...el, ...cambios } : el));

  const agregarTexto = useCallback(() => {
    if (!textoInput.trim()) return;
    const anchoBase = Math.min(350, textoInput.length * fontSize * 0.6 + 60);
    setElementos(prev => [...prev, {
      id: String(nextId++), tipo: 'texto', contenido: textoInput.trim(),
      x: 60, y: 100, w: anchoBase, h: fontSize + 24,
      fontSize, color: colorTexto, fontFamily, fontWeight,
      fontStyle, textDecoration, textAlign, shadowBlur,
    }]);
    setTextoInput('');
  }, [textoInput, fontSize, colorTexto, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur]);

  const agregarImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) =>
      setElementos(prev => [...prev, { id: String(nextId++), tipo: 'imagen', src: ev.target.result, x: 80, y: 100, w: 160, h: 160 }]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const eliminar = (id, e) => {
    if (e) e.stopPropagation();
    setElementos(prev => prev.filter(el => el.id !== id));
    if (seleccionado === id) setSelec(null);
  };

  // ── Drag ──
  const iniciarDrag = (e, id, x, y) => {
    e.stopPropagation(); setDragging(id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x, y };
  };
  const onMouseMoveDrag = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    actualizarEl(dragging, { x: elementStartPos.current.x + dx, y: elementStartPos.current.y + dy });
  }, [dragging]);
  const onMouseUpDrag = useCallback(() => setDragging(null), []);
  useEffect(() => {
    if (dragging) { window.addEventListener('mousemove', onMouseMoveDrag); window.addEventListener('mouseup', onMouseUpDrag); }
    return () => { window.removeEventListener('mousemove', onMouseMoveDrag); window.removeEventListener('mouseup', onMouseUpDrag); };
  }, [dragging, onMouseMoveDrag, onMouseUpDrag]);

  // ── Resize ──
  const iniciarResize = (e, id, w, h) => {
    e.stopPropagation(); setResizing(id);
    resizeStart.current = { x: e.clientX, y: e.clientY, w, h };
  };
  const onMouseMoveResize = useCallback((e) => {
    if (!resizing) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newW = Math.max(80, resizeStart.current.w + dx);
    const newH = Math.max(40, resizeStart.current.h + dy);
    const cambios = { w: newW, h: newH };
    const el = elementos.find(e => e.id === resizing);
    if (el?.tipo === 'texto') cambios.fontSize = Math.max(12, Math.round(newH * 0.55));
    actualizarEl(resizing, cambios);
  }, [resizing, elementos]);
  const onMouseUpResize = useCallback(() => setResizing(null), []);
  useEffect(() => {
    if (resizing) { window.addEventListener('mousemove', onMouseMoveResize); window.addEventListener('mouseup', onMouseUpResize); }
    return () => { window.removeEventListener('mousemove', onMouseMoveResize); window.removeEventListener('mouseup', onMouseUpResize); };
  }, [resizing, onMouseMoveResize, onMouseUpResize]);

  // ── Generar imagen ──
  const generarImagenDiseno = async () => {
    if (!escenaRef.current) return null;
    setSelec(null);
    await new Promise(r => setTimeout(r, 100));
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(escenaRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff', logging: false });
    return canvas.toDataURL('image/png');
  };

  // ── ACCIONES CON MODAL DE CONFIRMACIÓN ──────────────────────────────────────

  // Guardar — abre confirmación
  const pedirConfirmGuardar = () => setModalConfirm({ visible: true, tipo: 'guardar' });

  const ejecutarGuardar = async () => {
    setModalConfirm({ visible: false, tipo: null });
    setGuardando(true);
    try {
      const token = getToken();
      if (!token) {
        mostrarResultado('error', 'Sesión requerida', 'Debes iniciar sesión para guardar diseños.', () => { setModalResult(r => ({ ...r, visible: false })); navigate('/login'); });
        return;
      }
      const imageData = await generarImagenDiseno();
      const blob = await (await fetch(imageData)).blob();
      const user   = JSON.parse(localStorage.getItem('user'));
      const userId = user.id_usuario;
      const filePath = `usuario_${userId}/diseno-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage.from('borradores').upload(filePath, blob, { contentType: 'image/png' });
      if (uploadError) throw new Error('Error al subir la imagen');

      const { data: { publicUrl } } = supabase.storage.from('borradores').getPublicUrl(filePath);

      if (editandoBorradorId) {
        try {
          const { data: borradorActual } = await axios.get(`${API_BORRADORES}/${editandoBorradorId}`, { headers: { Authorization: `Bearer ${token}` } });
          const oldUrl = borradorActual?.imagen_preview;
          if (oldUrl?.includes('borradores/')) await supabase.storage.from('borradores').remove([oldUrl.split('borradores/')[1]]);
        } catch { /* silencioso */ }
      }

      const varianteId   = variante?.variante_id || variante?.id;
      const borradorData = {
        producto_id: productoId, variante_id: varianteId,
        nombre: `Diseño ${new Date().toLocaleString()}`,
        imagen_preview: publicUrl, elementos,
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editandoBorradorId) {
        await axios.put(`${API_BORRADORES}/${editandoBorradorId}`, borradorData, config);
        mostrarResultado('exito', '¡Diseño actualizado!', 'Tu diseño ha sido guardado con los cambios más recientes.', () => { setModalResult(r => ({ ...r, visible: false })); navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } }); });
      } else {
        await axios.post(API_BORRADORES, borradorData, config);
        mostrarResultado('exito', '¡Diseño guardado!', 'Tu diseño fue guardado correctamente en "Mis diseños".', () => { setModalResult(r => ({ ...r, visible: false })); navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } }); });
      }
    } catch (err) {
      console.error(err);
      mostrarResultado('error', 'Error al guardar', 'No se pudo guardar el diseño. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Carrito — abre confirmación
  const pedirConfirmCarrito = () => setModalConfirm({ visible: true, tipo: 'carrito' });

  const ejecutarCarrito = async () => {
    setModalConfirm({ visible: false, tipo: null });
    setGuardando(true);
    try {
      const token = getToken();
      if (!token) {
        mostrarResultado('error', 'Sesión requerida', 'Debes iniciar sesión para agregar al carrito.', () => { setModalResult(r => ({ ...r, visible: false })); navigate('/login'); });
        return;
      }
      const imagenUrl = await generarImagenDiseno();
      const blob      = await (await fetch(imagenUrl)).blob();
      const user      = JSON.parse(localStorage.getItem('user'));
      const userId    = user.id_usuario;
      const filePath  = `usuario_${userId}/carrito-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage.from('borradores').upload(filePath, blob, { contentType: 'image/png' });
      if (uploadError) throw new Error('Error al subir imagen');

      const { data: { publicUrl } } = supabase.storage.from('borradores').getPublicUrl(filePath);

      const varianteId         = variante?.variante_id || variante?.id;
      const textoPersonalizado = elementos.filter(el => el.tipo === 'texto').map(t => t.contenido).join(' | ');
      const precioAdicionalPersonalizacion = 50;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const { data: productoPersonalizado } = await axios.post(API_PRODUCTOS_PERS, {
        variante_id: varianteId, texto_personalizado: textoPersonalizado,
        imagen_personalizada_url: publicUrl, precio_adicional: precioAdicionalPersonalizacion,
      }, config);

      const precioBase              = parseFloat(variante?.precio_base || 0);
      const precioAdicionalVariante = parseFloat(variante?.precio_adicional || 0);
      const precioUnitario          = precioBase + precioAdicionalVariante + precioAdicionalPersonalizacion;

      const response = await axios.post(API_CARRITO, {
        producto_personalizado_id: productoPersonalizado.id,
        cantidad: 1, precio_unitario: precioUnitario,
      }, config);

      const esCantidadActualizada = response.data.message?.includes('Cantidad actualizada');
      mostrarResultado(
        'exito',
        esCantidadActualizada ? '¡Cantidad actualizada!' : '¡Agregado al carrito!',
        esCantidadActualizada
          ? 'La cantidad de este producto en tu carrito fue actualizada.'
          : 'Tu producto personalizado fue agregado correctamente al carrito.',
        () => { setModalResult(r => ({ ...r, visible: false })); navigate('/cliente/carrito'); }
      );
    } catch (err) {
      console.error(err);
      mostrarResultado('error', 'Error al agregar', 'No se pudo agregar al carrito. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Cancelar — abre confirmación solo si hay elementos, si no navega directo
  const pedirConfirmCancelar = () => {
    if (elementos.length === 0) { navegarAtras(); return; }
    setModalConfirm({ visible: true, tipo: 'cancelar' });
  };

  const navegarAtras = () => {
    if (editandoBorradorId) navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } });
    else navigate(`/cliente/producto/${productoId}`);
  };

  return (
    <div className="personalizador-page">

      {/* Modales */}
      <ModalConfirmacion
        visible={modalConfirm.visible}
        tipo={modalConfirm.tipo}
        esEdicion={!!editandoBorradorId}
        onConfirmar={
          modalConfirm.tipo === 'guardar'  ? ejecutarGuardar  :
          modalConfirm.tipo === 'carrito'  ? ejecutarCarrito  :
          modalConfirm.tipo === 'cancelar' ? navegarAtras     : undefined
        }
        onCancelar={() => setModalConfirm({ visible: false, tipo: null })}
      />
      <ModalResultado
        visible={modalResult.visible}
        tipo={modalResult.tipo}
        titulo={modalResult.titulo}
        mensaje={modalResult.mensaje}
        onCerrar={modalResult.onCerrar}
      />

      {/* Header */}
      <div className="personalizador-header">
        <button className="personalizador-back" onClick={pedirConfirmCancelar}>← Volver</button>
        <h1>🎨 {editandoBorradorId ? 'Edita tu diseño' : 'Personaliza tu producto'}</h1>
        <div></div>
      </div>

      <div className="personalizador-contenido">
        {/* Escena */}
        <div className="pers-scene-wrap">
          <div className="pers-scene" ref={escenaRef} onClick={() => setSelec(null)}>
            {!imgError && imgSrc
              ? <img src={imgSrc} alt="producto" className="pers-producto-img" draggable={false} crossOrigin="anonymous" />
              : <div className="pers-fallback-bg">🖼️ Vista previa no disponible</div>
            }
            {elementos.map(el => (
              <div
                key={el.id}
                className={`pers-elem ${seleccionado === el.id ? 'selected' : ''}`}
                style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, cursor: 'grab', zIndex: seleccionado === el.id ? 50 : 10 }}
                onClick={e => { e.stopPropagation(); setSelec(el.id); }}
                onMouseDown={e => iniciarDrag(e, el.id, el.x, el.y)}
              >
                {seleccionado === el.id && (
                  <button className="pers-del-btn" onClick={e => eliminar(el.id, e)}>✕</button>
                )}
                {el.tipo === 'texto' ? (
                  <div style={{
                    fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight, fontStyle: el.fontStyle,
                    textDecoration: el.textDecoration, textAlign: el.textAlign,
                    textShadow: `0 ${el.shadowBlur/2}px ${el.shadowBlur}px rgba(0,0,0,0.5)`,
                    pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
                    display: 'inline-block', lineHeight: 1.2, width: '100%',
                  }}>
                    {el.contenido}
                  </div>
                ) : (
                  <img src={el.src} alt="elemento" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
                )}
                {seleccionado === el.id && (
                  <div className="pers-resize-handle" onMouseDown={e => iniciarResize(e, el.id, el.w, el.h)} />
                )}
              </div>
            ))}
          </div>
          <p className="pers-hint">✨ Arrastra para mover · Esquina ↘️ para redimensionar</p>
        </div>

        {/* Panel de herramientas */}
        <div className="pers-tools">
          <div className="pers-tabs">
            <button className={`pers-tab ${tab === 'texto'  ? 'active' : ''}`} onClick={() => setTab('texto')}>📝 Texto</button>
            <button className={`pers-tab ${tab === 'imagen' ? 'active' : ''}`} onClick={() => setTab('imagen')}>🖼️ Imagen</button>
            <button className={`pers-tab ${tab === 'estilo' ? 'active' : ''}`} onClick={() => setTab('estilo')}>✨ Estilo</button>
          </div>

          {tab === 'texto' && (
            <div className="tool-section">
              <label className="tool-label">📝 Escribe tu texto</label>
              <input type="text" className="tool-input" placeholder="Ej: Familia García"
                value={textoInput} onChange={e => setTextoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarTexto()} />
              <button className="btn-agregar" onClick={agregarTexto}>+ Agregar texto</button>
            </div>
          )}

          {tab === 'imagen' && (
            <div className="tool-section">
              <label className="tool-label">🖼️ Subir logo / imagen</label>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={agregarImagen} />
              <button className="btn-agregar" onClick={() => fileRef.current?.click()}>📁 Elegir imagen</button>
            </div>
          )}

          {tab === 'estilo' && seleccionado && elementos.find(el => el.id === seleccionado)?.tipo === 'texto' && (
            <div className="tool-section">
              <label className="tool-label">🎨 Color</label>
              <div className="color-row">
                {TEXT_COLORS.map(c => (
                  <button key={c} className={`color-dot ${colorTexto === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
                ))}
              </div>
              <label className="tool-label">🔠 Fuente</label>
              <select className="tool-input" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <label className="tool-label">📏 Tamaño: {fontSize}px</label>
              <input type="range" min="14" max="100" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              <div className="style-buttons">
                <button className={`style-btn ${fontWeight     === 'bold'      ? 'active' : ''}`} onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}>B</button>
                <button className={`style-btn ${fontStyle      === 'italic'    ? 'active' : ''}`} onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}>I</button>
                <button className={`style-btn ${textDecoration === 'underline' ? 'active' : ''}`} onClick={() => setTextDeco(textDecoration === 'underline' ? 'none' : 'underline')}>U</button>
                <button className="style-btn" onClick={() => setTextAlign('left')}>←</button>
                <button className="style-btn" onClick={() => setTextAlign('center')}>↔</button>
                <button className="style-btn" onClick={() => setTextAlign('right')}>→</button>
              </div>
              <label className="tool-label">💨 Sombra: {shadowBlur}px</label>
              <input type="range" min="0" max="12" value={shadowBlur} onChange={e => setShadow(Number(e.target.value))} />
            </div>
          )}

          {elementos.length > 0 && (
            <div className="tool-section">
              <label className="tool-label">📚 Capas ({elementos.length})</label>
              {[...elementos].reverse().map(el => (
                <div key={el.id} className={`capa-item ${seleccionado === el.id ? 'active' : ''}`} onClick={() => setSelec(el.id)}>
                  <span>{el.tipo === 'texto' ? `📝 ${el.contenido.slice(0, 16)}` : '🖼️ Imagen'}</span>
                  <button className="capa-del" onClick={e => { e.stopPropagation(); eliminar(el.id, e); }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="tool-section acciones">
            <button className="btn-lista" onClick={pedirConfirmGuardar} disabled={guardando}>
              {editandoBorradorId ? '💾 Actualizar borrador' : '📋 Guardar en lista'}
            </button>
            {!editandoBorradorId && (
              <button className="btn-carrito" onClick={pedirConfirmCarrito} disabled={guardando}>
                🛒 Agregar al carrito
              </button>
            )}
            <button className="btn-cancelar" onClick={pedirConfirmCancelar}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoPersonalizador;