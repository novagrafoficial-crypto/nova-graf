// src/pages/Client/EditorDiseno.jsx
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/EditorDiseno.css';

const API_URL = import.meta.env.VITE_API_URL;

// ─── FUENTES MEJORADAS ────────────────────────────────────────────
const FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Pacifico', label: 'Pacifico (Cursiva)' },
  { value: 'Lobster', label: 'Lobster' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Raleway', label: 'Raleway' },
];

const TEXT_COLORS = [
  '#ffffff', '#000000', '#e63946', '#2563eb', '#16a34a', '#f59e0b',
  '#ec4899', '#f97316', '#06b6d4', '#d946ef', '#8b5cf6', '#14b8a6',
  '#f43f5e', '#84cc16', '#eab308', '#6366f1'
];

let nextId = 1;

const EditorDiseno = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ─── ESTADO DEL EDITOR ───────────────────────────────────────────
  const [elementos, setElementos] = useState([]);
  const [seleccionado, setSelec] = useState(null);
  const [tab, setTab] = useState('texto');
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [zoom, setZoom] = useState(100);

  // ─── ESTADO DEL TEXTO ────────────────────────────────────────────
  const [textoInput, setTextoInput] = useState('');
  const [colorTexto, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontWeight, setFontWeight] = useState('bold');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textAlign, setTextAlign] = useState('center');
  const [shadowBlur, setShadowBlur] = useState(4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [opacity, setOpacity] = useState(100);

  // ─── REFERENCIAS ──────────────────────────────────────────────────
  const escenaRef = useRef(null);
  const fileRef = useRef(null);

  // ─── DRAG AND RESIZE ────────────────────────────────────────────
  const [dragging, setDragging] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  const [resizing, setResizing] = useState(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const [rotating, setRotating] = useState(null);
  const rotateStart = useRef({ angle: 0, rotation: 0 });

  // ─── CARGAR PEDIDO ──────────────────────────────────────────────
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
        
        if (res.data.detalles && res.data.detalles.length > 0) {
          const detalle = res.data.detalles[0];
          if (detalle.imagen_url) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => setImgSrc(detalle.imagen_url);
            img.onerror = () => setImgError(true);
            img.src = detalle.imagen_url;
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  // ─── FUNCIONES DE MANIPULACIÓN ───────────────────────────────────
  const iniciarDrag = (e, elementId, x, y) => {
    e.stopPropagation();
    setDragging(elementId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x, y };
  };

  const iniciarResize = (e, elementId, w, h) => {
    e.stopPropagation();
    setResizing(elementId);
    resizeStart.current = { x: e.clientX, y: e.clientY, w, h };
  };

  const iniciarRotacion = (e, elementId, currentRotation) => {
    e.stopPropagation();
    setRotating(elementId);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    rotateStart.current = { angle, rotation: currentRotation || 0 };
  };

  // ─── AÑADIR ELEMENTOS ───────────────────────────────────────────
  const agregarTexto = () => {
    if (!textoInput.trim()) return;
    setElementos(prev => [...prev, {
      id: String(nextId++),
      tipo: 'texto',
      contenido: textoInput.trim(),
      x: 60, y: 100,
      w: Math.min(400, textoInput.length * fontSize * 0.6 + 60),
      h: fontSize + 24,
      rotation: 0,
      fontSize,
      color: colorTexto,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      shadowBlur,
      letterSpacing,
      lineHeight,
      opacity: opacity / 100,
    }]);
    setTextoInput('');
  };

  const agregarImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setElementos(prev => [...prev, {
        id: String(nextId++),
        tipo: 'imagen',
        src: ev.target.result,
        x: 80, y: 100,
        w: 160, h: 160,
        rotation: 0,
        opacity: 1,
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const eliminarElemento = (id, e) => {
    if (e) e.stopPropagation();
    setElementos(prev => prev.filter(el => el.id !== id));
    if (seleccionado === id) setSelec(null);
  };

  const duplicarElemento = (id, e) => {
    if (e) e.stopPropagation();
    const elemento = elementos.find(el => el.id === id);
    if (!elemento) return;
    setElementos(prev => [...prev, {
      ...elemento,
      id: String(nextId++),
      x: elemento.x + 20,
      y: elemento.y + 20,
    }]);
  };

  const actualizarElemento = (id, cambios) =>
    setElementos(prev => prev.map(el => el.id === id ? { ...el, ...cambios } : el));

  // ─── EVENTOS DE MOUSE ────────────────────────────────────────────
  useEffect(() => {
    const onMouseMoveDrag = (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      actualizarElemento(dragging, { 
        x: elementStartPos.current.x + dx, 
        y: elementStartPos.current.y + dy 
      });
    };

    const onMouseUpDrag = () => setDragging(null);

    const onMouseMoveResize = (e) => {
      if (!resizing) return;
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      const newW = Math.max(80, resizeStart.current.w + dx);
      const newH = Math.max(40, resizeStart.current.h + dy);
      const cambios = { w: newW, h: newH };
      const elemento = elementos.find(el => el.id === resizing);
      if (elemento?.tipo === 'texto') {
        cambios.fontSize = Math.max(12, Math.round(newH * 0.55));
      }
      actualizarElemento(resizing, cambios);
    };

    const onMouseUpResize = () => setResizing(null);

    const onMouseMoveRotate = (e) => {
      if (!rotating) return;
      const rect = document.querySelector(`[data-id="${rotating}"]`)?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const newRotation = rotateStart.current.rotation + (angle - rotateStart.current.angle) * (180 / Math.PI);
      actualizarElemento(rotating, { rotation: newRotation });
    };

    const onMouseUpRotate = () => setRotating(null);

    if (dragging) {
      window.addEventListener('mousemove', onMouseMoveDrag);
      window.addEventListener('mouseup', onMouseUpDrag);
    }
    if (resizing) {
      window.addEventListener('mousemove', onMouseMoveResize);
      window.addEventListener('mouseup', onMouseUpResize);
    }
    if (rotating) {
      window.addEventListener('mousemove', onMouseMoveRotate);
      window.addEventListener('mouseup', onMouseUpRotate);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMoveDrag);
      window.removeEventListener('mouseup', onMouseUpDrag);
      window.removeEventListener('mousemove', onMouseMoveResize);
      window.removeEventListener('mouseup', onMouseUpResize);
      window.removeEventListener('mousemove', onMouseMoveRotate);
      window.removeEventListener('mouseup', onMouseUpRotate);
    };
  }, [dragging, resizing, rotating, elementos]);

  // ─── GUARDAR DISEÑO ─────────────────────────────────────────────
  const guardarDiseno = async () => {
    if (elementos.length === 0) {
      alert('⚠️ Agrega al menos un elemento (texto o imagen) antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Debes iniciar sesión');
        setGuardando(false);
        return;
      }

      if (!escenaRef.current) return;
      setSelec(null);
      await new Promise(r => setTimeout(r, 200));
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(escenaRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
      });
      
      const imageData = canvas.toDataURL('image/png');
      const blob = await (await fetch(imageData)).blob();
      
      const user = JSON.parse(localStorage.getItem('user'));
      const fileName = `diseno_pedido_${id}_${Date.now()}.png`;
      const filePath = `disenos/usuario_${user.id_usuario}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('borradores')
        .upload(filePath, blob, { 
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);
      
      const { data: { publicUrl } } = supabase.storage
        .from('borradores')
        .getPublicUrl(filePath);

      await axios.post(
        `${API_URL}/api/client/pedidos/${id}/diseno`,
        {
          tipo_origen: 'SIMULADOR',
          simulador_json: JSON.stringify(elementos),
          archivo_url: publicUrl,
          notas_cliente: 'Diseño creado con el editor interactivo'
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      alert('✅ Diseño guardado correctamente');
      navigate(`/cliente/pedido/${id}`);
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar el diseño: ' + (error.response?.data?.message || error.message));
    } finally {
      setGuardando(false);
    }
  };

  // ─── SELECCIONAR ELEMENTO Y ACTUALIZAR CONTROLES ────────────────
  useEffect(() => {
    if (!seleccionado) return;
    const elemento = elementos.find(el => el.id === seleccionado);
    if (!elemento) return;
    
    if (elemento.tipo === 'texto') {
      setColor(elemento.color || '#ffffff');
      setFontSize(elemento.fontSize || 32);
      setFontFamily(elemento.fontFamily || 'Poppins');
      setFontWeight(elemento.fontWeight || 'bold');
      setFontStyle(elemento.fontStyle || 'normal');
      setTextDecoration(elemento.textDecoration || 'none');
      setTextAlign(elemento.textAlign || 'center');
      setShadowBlur(elemento.shadowBlur || 4);
      setLetterSpacing(elemento.letterSpacing || 0);
      setLineHeight(elemento.lineHeight || 1.4);
      setOpacity((elemento.opacity || 1) * 100);
    }
  }, [seleccionado, elementos]);

  // ─── ACTUALIZAR ELEMENTO CUANDO CAMBIAN CONTROLES ──────────────
  useEffect(() => {
    if (!seleccionado) return;
    const elemento = elementos.find(el => el.id === seleccionado);
    if (!elemento || elemento.tipo !== 'texto') return;
    
    actualizarElemento(seleccionado, {
      color: colorTexto,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      shadowBlur,
      letterSpacing,
      lineHeight,
      opacity: opacity / 100,
    });
  }, [colorTexto, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur, letterSpacing, lineHeight, opacity]);

  if (loading) return <div className="editor-loading">Cargando...</div>;
  if (error) return <div className="editor-error">{error}</div>;

  return (
    <div className="editor-page">
      <div className="editor-header">
        <button className="editor-back" onClick={() => navigate(`/cliente/pedido/${id}`)}>
          ← Volver al pedido
        </button>
        <div className="editor-header-info">
          <h2>🎨 Editor interactivo</h2>
          <p>Diseña tu producto agregando texto, imágenes y más</p>
          <span className="editor-pedido-info">
            Pedido #{id} • Estado: {pedido?.estado || 'Cargando...'}
          </span>
        </div>
      </div>

      <div className="editor-contenido">
        {/* ─── ESCENA ─── */}
        <div className="editor-scene-wrap">
          <div className="editor-scene" ref={escenaRef} onClick={() => setSelec(null)}>
            {!imgError && imgSrc ? (
              <img src={imgSrc} alt="producto" className="editor-producto-img" draggable={false} crossOrigin="anonymous" />
            ) : (
              <div className="editor-fallback-bg">🖼️ Producto</div>
            )}
            {elementos.map(el => (
              <div
                key={el.id}
                data-id={el.id}
                className={`editor-elem ${seleccionado === el.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: el.x, top: el.y,
                  width: el.w, height: el.h,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  opacity: el.opacity || 1,
                  cursor: 'grab',
                  zIndex: seleccionado === el.id ? 50 : 10,
                }}
                onClick={(e) => { e.stopPropagation(); setSelec(el.id); }}
                onMouseDown={(e) => iniciarDrag(e, el.id, el.x, el.y)}
              >
                {seleccionado === el.id && (
                  <>
                    <button className="editor-del-btn" onClick={(e) => eliminarElemento(el.id, e)}>✕</button>
                    <button className="editor-duplicate-btn" onClick={(e) => duplicarElemento(el.id, e)}>📋</button>
                  </>
                )}
                {el.tipo === 'texto' ? (
                  <div style={{
                    fontSize: el.fontSize,
                    color: el.color,
                    fontFamily: el.fontFamily,
                    fontWeight: el.fontWeight,
                    fontStyle: el.fontStyle,
                    textDecoration: el.textDecoration,
                    textAlign: el.textAlign,
                    letterSpacing: `${el.letterSpacing || 0}px`,
                    lineHeight: el.lineHeight || 1.4,
                    textShadow: `0 ${el.shadowBlur / 2}px ${el.shadowBlur}px rgba(0,0,0,0.5)`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                  }}>{el.contenido}</div>
                ) : (
                  <img src={el.src} alt="elemento" style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain', 
                    pointerEvents: 'none' 
                  }} draggable={false} />
                )}
                {seleccionado === el.id && (
                  <>
                    <div className="editor-resize-handle" onMouseDown={(e) => iniciarResize(e, el.id, el.w, el.h)} />
                    <div className="editor-rotate-handle" onMouseDown={(e) => iniciarRotacion(e, el.id, el.rotation)}>
                      ↻
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="editor-controls-bottom">
            <span>✨ Arrastra para mover</span>
            <span>↘️ Redimensionar</span>
            <span>↻ Girar</span>
          </div>
        </div>

        {/* ─── HERRAMIENTAS ─── */}
        <div className="editor-tools">
          <div className="editor-tabs">
            <button className={`editor-tab ${tab === 'texto' ? 'active' : ''}`} onClick={() => setTab('texto')}>
              📝 Texto
            </button>
            <button className={`editor-tab ${tab === 'imagen' ? 'active' : ''}`} onClick={() => setTab('imagen')}>
              🖼️ Imagen
            </button>
            <button className={`editor-tab ${tab === 'estilo' ? 'active' : ''}`} onClick={() => setTab('estilo')}>
              ✨ Estilo
            </button>
            <button className={`editor-tab ${tab === 'capas' ? 'active' : ''}`} onClick={() => setTab('capas')}>
              📚 Capas
            </button>
          </div>

          {tab === 'texto' && (
            <div className="tool-section">
              <label className="tool-label">📝 Escribe tu texto</label>
              <input
                type="text"
                className="tool-input"
                placeholder="Ej: Familia García"
                value={textoInput}
                onChange={e => setTextoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarTexto()}
              />
              <button className="btn-agregar" onClick={agregarTexto}>
                + Agregar texto
              </button>
            </div>
          )}

          {tab === 'imagen' && (
            <div className="tool-section">
              <label className="tool-label">🖼️ Subir logo / imagen</label>
              <div className="file-upload-area" onClick={() => fileRef.current?.click()}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={agregarImagen}
                />
                <span>📁 Haz clic para seleccionar una imagen</span>
                <small>PNG, JPG, SVG (máx. 5MB)</small>
              </div>
            </div>
          )}

          {tab === 'estilo' && seleccionado && elementos.find(el => el.id === seleccionado)?.tipo === 'texto' && (
            <div className="tool-section tool-section-scroll">
              <label className="tool-label">🎨 Color</label>
              <div className="color-row">
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-dot ${colorTexto === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <label className="tool-label">🔠 Fuente</label>
              <select className="tool-input" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>

              <label className="tool-label">📏 Tamaño: {fontSize}px</label>
              <input
                type="range"
                min="12"
                max="120"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="tool-range"
              />

              <label className="tool-label">📐 Espaciado: {letterSpacing}px</label>
              <input
                type="range"
                min="0"
                max="10"
                value={letterSpacing}
                onChange={e => setLetterSpacing(Number(e.target.value))}
                className="tool-range"
              />

              <label className="tool-label">📏 Interlineado: {lineHeight}</label>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.1"
                value={lineHeight}
                onChange={e => setLineHeight(Number(e.target.value))}
                className="tool-range"
              />

              <label className="tool-label">💨 Sombra: {shadowBlur}px</label>
              <input
                type="range"
                min="0"
                max="20"
                value={shadowBlur}
                onChange={e => setShadowBlur(Number(e.target.value))}
                className="tool-range"
              />

              <label className="tool-label">👁️ Opacidad: {opacity}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={e => setOpacity(Number(e.target.value))}
                className="tool-range"
              />

              <div className="style-buttons">
                <button className={`style-btn ${fontWeight === 'bold' ? 'active' : ''}`} onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}>
                  <strong>B</strong>
                </button>
                <button className={`style-btn ${fontStyle === 'italic' ? 'active' : ''}`} onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}>
                  <em>I</em>
                </button>
                <button className={`style-btn ${textDecoration === 'underline' ? 'active' : ''}`} onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}>
                  <u>U</u>
                </button>
                <button className="style-btn" onClick={() => setTextAlign('left')}>←</button>
                <button className="style-btn" onClick={() => setTextAlign('center')}>↔</button>
                <button className="style-btn" onClick={() => setTextAlign('right')}>→</button>
              </div>
            </div>
          )}

          {tab === 'estilo' && (!seleccionado || elementos.find(el => el.id === seleccionado)?.tipo !== 'texto') && (
            <div className="tool-section">
              <p className="tool-hint">ℹ️ Selecciona un elemento de texto para ver sus opciones de estilo</p>
            </div>
          )}

          {tab === 'capas' && (
            <div className="tool-section">
              <label className="tool-label">📚 Capas ({elementos.length})</label>
              {elementos.length === 0 ? (
                <p className="tool-hint">No hay elementos. Agrega texto o imágenes.</p>
              ) : (
                [...elementos].reverse().map(el => (
                  <div
                    key={el.id}
                    className={`capa-item ${seleccionado === el.id ? 'active' : ''}`}
                    onClick={() => setSelec(el.id)}
                  >
                    <span className="capa-icon">{el.tipo === 'texto' ? '📝' : '🖼️'}</span>
                    <span className="capa-nombre">
                      {el.tipo === 'texto' ? el.contenido.slice(0, 20) : 'Imagen'}
                      {el.tipo === 'texto' && el.contenido.length > 20 ? '...' : ''}
                    </span>
                    <button className="capa-del" onClick={e => { e.stopPropagation(); eliminarElemento(el.id, e); }}>
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="tool-section acciones">
            <button className="btn-guardar" onClick={guardarDiseno} disabled={guardando || elementos.length === 0}>
              {guardando ? '💾 Guardando...' : '💾 Guardar diseño'}
            </button>
            <button className="btn-cancelar" onClick={() => navigate(`/cliente/pedido/${id}`)}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorDiseno;