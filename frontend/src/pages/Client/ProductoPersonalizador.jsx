// frontend/src/pages/Client/ProductoPersonalizador.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import '../../styles/client/ProductoPersonalizado.css';

const TEXT_COLORS = ['#ffffff','#000000','#e63946','#2563eb','#16a34a','#f59e0b','#ec4899'];
let nextId = 1;

const ProductoPersonalizador = ({ imagenProducto, onGuardar, onCancelar }) => {
  const [elementos, setElementos]   = useState([]);
  const [seleccionado, setSelec]    = useState(null);
  const [textoInput, setTextoInput] = useState('');
  const [colorTexto, setColor]      = useState('#ffffff');
  const [fontSize, setFontSize]     = useState(28);
  const [guardando, setGuardando]   = useState(false);
  const [tab, setTab]               = useState('texto');
  const [imgError, setImgError]     = useState(false);
  
  const escenaRef = useRef(null);
  const fileRef   = useRef(null);

  // ── VALIDAR IMAGEN DEL PRODUCTO ─────────────────────────────────────────
  const [imgSrc, setImgSrc] = useState(null);
  useEffect(() => {
    if (!imagenProducto) {
      setImgError(true);
      return;
    }
    // Si es una URL externa, intentar cargar
    const img = new Image();
    img.onload = () => setImgSrc(imagenProducto);
    img.onerror = () => {
      console.warn('No se pudo cargar la imagen del producto:', imagenProducto);
      setImgError(true);
    };
    img.src = imagenProducto;
  }, [imagenProducto]);

  // ── AGREGAR TEXTO (con dimensiones seguras) ──────────────────────────────
  const agregarTexto = useCallback(() => {
    if (!textoInput.trim()) return;
    // Altura base: suficiente para el texto en una línea + padding
    const alturaSegura = Math.max(40, fontSize + 16);
    setElementos(prev => [...prev, {
      id: String(nextId++),
      tipo: 'texto',
      contenido: textoInput.trim(),
      x: 60, y: 100,
      w: Math.min(300, textoInput.length * fontSize * 0.6 + 30), // ancho dinámico
      h: alturaSegura,
      fontSize,
      color: colorTexto,
    }]);
    setTextoInput('');
  }, [textoInput, fontSize, colorTexto]);

  // ── AGREGAR IMAGEN ─────────────────────────────────────────────────────
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
      }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── ELIMINAR ───────────────────────────────────────────────────────────
  const eliminar = (id, e) => {
    if (e) e.stopPropagation();
    setElementos(prev => prev.filter(el => el.id !== id));
    if (seleccionado === id) setSelec(null);
  };

  // ── ACTUALIZAR ELEMENTO ────────────────────────────────────────────────
  const actualizarEl = (id, cambios) => {
    setElementos(prev => prev.map(el => el.id === id ? { ...el, ...cambios } : el));
  };

  // ── GUARDAR CON HTML2CANVAS ─────────────────────────────────────────────
  const guardar = async () => {
    if (!escenaRef.current) return;
    setSelec(null);
    setGuardando(true);
    await new Promise(r => setTimeout(r, 50)); // esperar a que desaparezca el outline

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(escenaRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
      });
      canvas.toBlob((blob) => {
        if (!blob) {
          setGuardando(false);
          return;
        }
        const imagenUrl = URL.createObjectURL(blob);
        const json = { elementos, timestamp: Date.now() };
        onGuardar(imagenUrl, json);
        URL.revokeObjectURL(imagenUrl);
        setGuardando(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error al capturar:', err);
      setGuardando(false);
    }
  };

  return (
    <div className="pers-overlay" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="pers-modal">
        <div className="pers-header">
          <h2>🎨 Personaliza tu producto</h2>
          <button className="pers-close" onClick={onCancelar}>✕</button>
        </div>

        <div className="pers-body">
          {/* ESCENA */}
          <div className="pers-scene-wrap">
            <div className="pers-scene" ref={escenaRef} onClick={() => setSelec(null)}>
              {/* Imagen de fondo */}
              {!imgError && imgSrc ? (
                <img
                  src={imgSrc}
                  alt="producto"
                  className="pers-producto-img"
                  draggable={false}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="pers-fallback-bg">
                  <span>🖼️ Vista previa no disponible</span>
                </div>
              )}

              {/* Elementos flotantes */}
              {elementos.map(el => (
                <Rnd
                  key={el.id}
                  size={{ width: el.w, height: el.h }}
                  position={{ x: el.x, y: el.y }}
                  bounds="parent"
                  onDragStop={(_, d) => actualizarEl(el.id, { x: d.x, y: d.y })}
                  onResizeStop={(_, __, ref, ___, pos) => {
                    const newW = parseInt(ref.style.width);
                    const newH = parseInt(ref.style.height);
                    const cambios = { w: newW, h: newH, x: pos.x, y: pos.y };
                    // Solo ajustar fontSize si es texto y se redimensionó altura
                    if (el.tipo === 'texto') {
                      const newFontSize = Math.max(12, Math.round(newH * 0.55));
                      cambios.fontSize = newFontSize;
                    }
                    actualizarEl(el.id, cambios);
                  }}
                  style={{ zIndex: seleccionado === el.id ? 50 : 10 }}
                  onClick={e => { e.stopPropagation(); setSelec(el.id); }}
                  className={`pers-rnd-elem ${seleccionado === el.id ? 'selected' : ''}`}
                  enableResizing={{
                    bottomRight: true,
                    bottom: false, top: false, left: false, right: false,
                    topLeft: false, topRight: false, bottomLeft: false,
                  }}
                >
                  {seleccionado === el.id && (
                    <button
                      className="pers-del-btn"
                      onClick={(e) => eliminar(el.id, e)}
                    >✕</button>
                  )}
                  {el.tipo === 'texto' ? (
                    <span style={{
                      fontSize: el.fontSize,
                      color: el.color,
                      fontFamily: 'Arial, sans-serif',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                      display: 'inline-block',
                      lineHeight: 1.2,
                    }}>
                      {el.contenido}
                    </span>
                  ) : (
                    <img
                      src={el.src}
                      alt="elemento"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                      draggable={false}
                    />
                  )}
                </Rnd>
              ))}
            </div>
            <p className="pers-hint">
              Arrastra · esquina inferior derecha para redimensionar
            </p>
          </div>

          {/* PANEL HERRAMIENTAS */}
          <div className="pers-tools">
            <div className="pers-tabs">
              <button className={`pers-tab ${tab === 'texto' ? 'active' : ''}`} onClick={() => setTab('texto')}>Texto</button>
              <button className={`pers-tab ${tab === 'imagen' ? 'active' : ''}`} onClick={() => setTab('imagen')}>Imagen</button>
            </div>

            {tab === 'texto' && (
              <div className="tool-section">
                <label className="tool-label">📝 Texto</label>
                <input
                  type="text"
                  className="tool-input"
                  placeholder="Escribe aquí..."
                  value={textoInput}
                  maxLength={35}
                  onChange={e => setTextoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarTexto()}
                />
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
                <label className="tool-label">🔠 Tamaño: {fontSize}px</label>
                <input
                  type="range" min="14" max="72" value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <button className="btn-agregar" onClick={agregarTexto}>+ Agregar texto</button>
              </div>
            )}

            {tab === 'imagen' && (
              <div className="tool-section">
                <label className="tool-label">🖼️ Subir imagen / logo</label>
                <p className="tool-hint">Se agregará como elemento movible.</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={agregarImagen}
                />
                <button className="btn-agregar" onClick={() => fileRef.current?.click()}>📁 Elegir imagen</button>
              </div>
            )}

            {/* Lista de capas */}
            {elementos.length > 0 && (
              <div className="tool-section">
                <label className="tool-label">📚 Capas ({elementos.length})</label>
                {[...elementos].reverse().map(el => (
                  <div
                    key={el.id}
                    className={`capa-item ${seleccionado === el.id ? 'active' : ''}`}
                    onClick={() => setSelec(el.id)}
                  >
                    <span>{el.tipo === 'texto' ? `📝 ${el.contenido.slice(0, 16)}` : '🖼️ Imagen'}</span>
                    <button className="capa-del" onClick={e => { e.stopPropagation(); eliminar(el.id, e); }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="tool-section acciones">
              <button className="btn-guardar" onClick={guardar} disabled={guardando}>
                {guardando ? '⏳ Guardando...' : '💾 Guardar diseño'}
              </button>
              <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoPersonalizador;