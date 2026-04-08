import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
 import { supabase } from '../../lib/supabase';
import axios from 'axios';
import { getToken } from '../../utils/auth';
import '../../styles/client/ProductoPersonalizado.css';

const FONTS = [
  'Arial', 'Verdana', 'Georgia', 'Times New Roman',
  'Poppins', 'Montserrat', 'Pacifico', 'Lobster',
  'Bebas Neue', 'Oswald', 'Playfair Display', 'Dancing Script'
];

const TEXT_COLORS = ['#ffffff','#000000','#e63946','#2563eb','#16a34a','#f59e0b','#ec4899','#f97316','#06b6d4','#d946ef'];

let nextId = 1;

const ProductoPersonalizador = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    imagenProducto, 
    productoId, 
    variante, 
    borradorId,
    elementosGuardados
  } = location.state || {};

  const [elementos, setElementos] = useState([]);
  const [seleccionado, setSelec] = useState(null);
  const [textoInput, setTextoInput] = useState('');
  const [colorTexto, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Poppins');
  const [fontWeight, setFontWeight] = useState('bold');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textAlign, setTextAlign] = useState('center');
  const [shadowBlur, setShadowBlur] = useState(4);
  const [guardando, setGuardando] = useState(false);
  const [tab, setTab] = useState('texto');
  const [imgError, setImgError] = useState(false);
  const [editandoBorradorId, setEditandoBorradorId] = useState(borradorId || null);

  const escenaRef = useRef(null);
  const fileRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const [dragging, setDragging] = useState(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    if (!imagenProducto) {
      setImgError(true);
      return;
    }
    const img = new Image();
    img.onload = () => setImgSrc(imagenProducto);
    img.onerror = () => {
      console.warn('Error cargando imagen:', imagenProducto);
      setImgError(true);
    };
    img.src = imagenProducto;
  }, [imagenProducto]);

  useEffect(() => {
    if (borradorId && elementosGuardados) {
      const maxId = elementosGuardados.reduce((max, el) => Math.max(max, parseInt(el.id) || 0), 0);
      nextId = maxId + 1;
      setElementos(elementosGuardados);
    }
  }, [borradorId, elementosGuardados]);

  useEffect(() => {
    if (seleccionado) {
      const elemento = elementos.find(el => el.id === seleccionado);
      if (elemento && elemento.tipo === 'texto') {
        setColor(elemento.color);
        setFontSize(elemento.fontSize);
        setFontFamily(elemento.fontFamily || 'Poppins');
        setFontWeight(elemento.fontWeight || 'bold');
        setFontStyle(elemento.fontStyle || 'normal');
        setTextDecoration(elemento.textDecoration || 'none');
        setTextAlign(elemento.textAlign || 'center');
        setShadowBlur(elemento.shadowBlur || 4);
      }
    }
  }, [seleccionado, elementos]);

  useEffect(() => {
    if (seleccionado) {
      const elemento = elementos.find(el => el.id === seleccionado);
      if (elemento && elemento.tipo === 'texto') {
        actualizarEl(seleccionado, {
          color: colorTexto,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          textDecoration: textDecoration,
          textAlign: textAlign,
          shadowBlur: shadowBlur
        });
      }
    }
  }, [colorTexto, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur, seleccionado]);

  const agregarTexto = useCallback(() => {
    if (!textoInput.trim()) return;
    const anchoBase = Math.min(350, textoInput.length * fontSize * 0.6 + 60);
    setElementos(prev => [...prev, {
      id: String(nextId++),
      tipo: 'texto',
      contenido: textoInput.trim(),
      x: 60, y: 100,
      w: anchoBase,
      h: fontSize + 24,
      fontSize,
      color: colorTexto,
      fontFamily,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      shadowBlur,
    }]);
    setTextoInput('');
  }, [textoInput, fontSize, colorTexto, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur]);

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

  const eliminar = (id, e) => {
    if (e) e.stopPropagation();
    setElementos(prev => prev.filter(el => el.id !== id));
    if (seleccionado === id) setSelec(null);
  };

  const actualizarEl = (id, cambios) => {
    setElementos(prev => prev.map(el => el.id === id ? { ...el, ...cambios } : el));
  };

  const iniciarDrag = (e, id, x, y) => {
    e.stopPropagation();
    setDragging(id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x, y };
  };

  const onMouseMoveDrag = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    const newX = elementStartPos.current.x + dx;
    const newY = elementStartPos.current.y + dy;
    actualizarEl(dragging, { x: newX, y: newY });
  }, [dragging]);

  const onMouseUpDrag = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMoveDrag);
      window.addEventListener('mouseup', onMouseUpDrag);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMoveDrag);
      window.removeEventListener('mouseup', onMouseUpDrag);
    };
  }, [dragging, onMouseMoveDrag, onMouseUpDrag]);

  const iniciarResize = (e, id, w, h) => {
    e.stopPropagation();
    setResizing(id);
    resizeStart.current = { x: e.clientX, y: e.clientY, w, h };
  };

  const onMouseMoveResize = useCallback((e) => {
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
    actualizarEl(resizing, cambios);
  }, [resizing, elementos]);

  const onMouseUpResize = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onMouseMoveResize);
      window.addEventListener('mouseup', onMouseUpResize);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMoveResize);
      window.removeEventListener('mouseup', onMouseUpResize);
    };
  }, [resizing, onMouseMoveResize, onMouseUpResize]);

  const generarImagenDiseno = async () => {
    if (!escenaRef.current) return null;
    setSelec(null);
    await new Promise(r => setTimeout(r, 50));
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(escenaRef.current, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  };

const guardarEnLista = async () => {
  setGuardando(true);
  try {
    const token = getToken();
    if (!token) {
      alert('Debes iniciar sesión para guardar diseños');
      navigate('/login');
      return;
    }

    // 1. Generar nueva imagen como blob
    setSelec(null);
    await new Promise(r => setTimeout(r, 50));
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(escenaRef.current, {
      useCORS: true,
      scale: 1.5,
      backgroundColor: '#ffffff',
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    // 2. Obtener ID de usuario
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.id_usuario;

    // 3. Subir nueva imagen a Supabase Storage
    const fileName = `diseno-${Date.now()}.png`;
    const filePath = `usuario_${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('borradores')
      .upload(filePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError);
      alert('Error al subir la imagen. Intenta nuevamente.');
      return;
    }

    // 4. Obtener URL pública de la nueva imagen
    const { data: { publicUrl } } = supabase.storage
      .from('borradores')
      .getPublicUrl(filePath);

    // 5. Si estamos editando, eliminar la imagen antigua (si existe)
    if (editandoBorradorId) {
  try {
    // Obtener datos actuales del borrador
    const { data: borradorActual } = await axios.get(
      `http://localhost:5000/api/client/borradores/${editandoBorradorId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const oldImageUrl = borradorActual?.imagen_preview;
    if (oldImageUrl) {
      // Extraer el path de la URL pública de Supabase
      // URL ejemplo: https://dobgpjhgmenqysikaete.supabase.co/storage/v1/object/public/borradores/usuario_4/diseno-123.png
      const urlParts = oldImageUrl.split('/public/borradores/');
      if (urlParts.length === 2) {
        const oldFilePath = urlParts[1]; // "usuario_4/diseno-123.png"
        console.log('🗑️ Intentando eliminar:', oldFilePath);

        const { error: deleteError } = await supabase.storage
          .from('borradores')
          .remove([oldFilePath]);

        if (deleteError) {
          console.error('❌ Error al eliminar imagen antigua:', deleteError);
        } else {
          console.log('✅ Imagen antigua eliminada');
        }
      } else {
        console.warn('⚠️ Formato de URL no reconocido:', oldImageUrl);
      }
    }
  } catch (err) {
    console.warn('⚠️ No se pudo eliminar la imagen anterior:', err);
  }
}

    // 6. Preparar datos para el backend
    const varianteId = variante?.variante_id || variante?.id;
    const borradorData = {
      producto_id: productoId,
      variante_id: varianteId,
      nombre: `Diseño ${new Date().toLocaleString()}`,
      imagen_preview: publicUrl,
      elementos: elementos,
    };

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 7. Guardar o actualizar en la BD
    if (editandoBorradorId) {
      await axios.put(`http://localhost:5000/api/client/borradores/${editandoBorradorId}`, borradorData, config);
      alert('✅ Diseño actualizado correctamente.');
    } else {
      await axios.post('http://localhost:5000/api/client/borradores', borradorData, config);
      alert('✅ Diseño guardado en tu lista.');
    }

    navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } });
  } catch (err) {
    console.error(err);
    alert('Error al guardar el diseño. Intenta nuevamente.');
  } finally {
    setGuardando(false);
  }
};

  const agregarAlCarrito = async () => {
  setGuardando(true);
  try {
    const token = getToken();
    if (!token) {
      alert('Debes iniciar sesión');
      navigate('/login');
      return;
    }

    // Generar imagen del diseño
    const imagenUrl = await generarImagenDiseno();
    
    // Convertir base64 a blob para subir a Supabase
    const blob = await (await fetch(imagenUrl)).blob();
    
    // Subir imagen a Supabase Storage (carpeta "carrito" o reusar la misma lógica)
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.id_usuario;
    const fileName = `carrito-${Date.now()}.png`;
    const filePath = `usuario_${userId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('borradores')
      .upload(filePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError);
      alert('Error al procesar la imagen');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('borradores')
      .getPublicUrl(filePath);

    // Obtener precio (precio base + adicional de variante + adicional por personalización)
    // Asumimos que el precio base y adicional vienen en `variante` o los calculamos
    const precioBase = variante?.precio_base || producto?.precio_base || 0;
    const precioAdicionalVariante = variante?.precio_adicional || 0;
    const precioAdicionalPersonalizacion = 50; // Ejemplo: costo fijo por personalizar

    const precioUnitario = precioBase + precioAdicionalVariante + precioAdicionalPersonalizacion;

    // Datos para el backend
    const payload = {
      variante_id: variante?.variante_id || variante?.id,
      imagen_personalizada_url: publicUrl,
      texto_personalizado: elementos.filter(el => el.tipo === 'texto').map(t => t.contenido).join(' | '),
      precio_adicional: precioAdicionalPersonalizacion,
      precio_unitario: precioUnitario,
      cantidad: 1
    };

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    await axios.post('http://localhost:5000/api/client/carrito', payload, config);
    
    alert('🛒 Producto personalizado agregado al carrito');
    navigate('/cliente/carrito');
  } catch (err) {
    console.error(err);
    alert('Error al agregar al carrito');
  } finally {
    setGuardando(false);
  }
};

  const cancelar = () => {
    if (editandoBorradorId) {
      navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } });
    } else {
      navigate(`/cliente/producto/${productoId}`);
    }
  };

  return (
    <div className="personalizador-page">
      <div className="personalizador-header">
        <button className="personalizador-back" onClick={cancelar}>← Volver</button>
        <h1>🎨 {editandoBorradorId ? 'Edita tu diseño' : 'Personaliza tu producto'}</h1>
        <div></div>
      </div>
      <div className="personalizador-contenido">
        <div className="pers-scene-wrap">
          <div className="pers-scene" ref={escenaRef} onClick={() => setSelec(null)}>
            {!imgError && imgSrc ? (
              <img src={imgSrc} alt="producto" className="pers-producto-img" draggable={false} />
            ) : (
              <div className="pers-fallback-bg">🖼️ Vista previa no disponible</div>
            )}
            {elementos.map(el => (
              <div
                key={el.id}
                className={`pers-elem ${seleccionado === el.id ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.w,
                  height: el.h,
                  cursor: 'grab',
                  zIndex: seleccionado === el.id ? 50 : 10,
                }}
                onClick={(e) => { e.stopPropagation(); setSelec(el.id); }}
                onMouseDown={(e) => iniciarDrag(e, el.id, el.x, el.y)}
              >
                {seleccionado === el.id && (
                  <button className="pers-del-btn" onClick={(e) => eliminar(el.id, e)}>✕</button>
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
                    textShadow: `0 ${el.shadowBlur/2}px ${el.shadowBlur}px rgba(0,0,0,0.5)`,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    lineHeight: 1.2,
                    width: '100%',
                  }}>
                    {el.contenido}
                  </div>
                ) : (
                  <img src={el.src} alt="elemento" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
                )}
                {seleccionado === el.id && (
                  <div className="pers-resize-handle" onMouseDown={(e) => iniciarResize(e, el.id, el.w, el.h)} />
                )}
              </div>
            ))}
          </div>
          <p className="pers-hint">✨ Arrastra para mover · Esquina ↘️ para redimensionar</p>
        </div>

        <div className="pers-tools">
          <div className="pers-tabs">
            <button className={`pers-tab ${tab === 'texto' ? 'active' : ''}`} onClick={() => setTab('texto')}>📝 Texto</button>
            <button className={`pers-tab ${tab === 'imagen' ? 'active' : ''}`} onClick={() => setTab('imagen')}>🖼️ Imagen</button>
            <button className={`pers-tab ${tab === 'estilo' ? 'active' : ''}`} onClick={() => setTab('estilo')}>✨ Estilo</button>
          </div>

          {tab === 'texto' && (
            <div className="tool-section">
              <label className="tool-label">📝 Escribe tu texto</label>
              <input type="text" className="tool-input" placeholder="Ej: Familia García" value={textoInput} onChange={e => setTextoInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarTexto()} />
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
                {TEXT_COLORS.map(c => <button key={c} className={`color-dot ${colorTexto === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}
              </div>
              <label className="tool-label">🔠 Fuente</label>
              <select className="tool-input" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <label className="tool-label">📏 Tamaño: {fontSize}px</label>
              <input type="range" min="14" max="100" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              <div className="style-buttons">
                <button className={`style-btn ${fontWeight === 'bold' ? 'active' : ''}`} onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}>B</button>
                <button className={`style-btn ${fontStyle === 'italic' ? 'active' : ''}`} onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}>I</button>
                <button className={`style-btn ${textDecoration === 'underline' ? 'active' : ''}`} onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}>U</button>
                <button className="style-btn" onClick={() => setTextAlign('left')}>←</button>
                <button className="style-btn" onClick={() => setTextAlign('center')}>↔</button>
                <button className="style-btn" onClick={() => setTextAlign('right')}>→</button>
              </div>
              <label className="tool-label">💨 Sombra: {shadowBlur}px</label>
              <input type="range" min="0" max="12" value={shadowBlur} onChange={e => setShadowBlur(Number(e.target.value))} />
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

          <div className="tool-section acciones">
            <button className="btn-lista" onClick={guardarEnLista} disabled={guardando}>
              {editandoBorradorId ? '💾 Actualizar borrador' : '📋 Guardar en lista'}
            </button>
            <button className="btn-carrito" onClick={agregarAlCarrito} disabled={guardando}>🛒 Agregar al carrito</button>
            <button className="btn-cancelar" onClick={cancelar}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoPersonalizador;