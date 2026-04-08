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

  // Cargar imagen de fondo
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

  // Cargar elementos guardados al editar un borrador
  useEffect(() => {
    if (borradorId && elementosGuardados) {
      const maxId = elementosGuardados.reduce((max, el) => Math.max(max, parseInt(el.id) || 0), 0);
      nextId = maxId + 1;
      setElementos(elementosGuardados);
    }
  }, [borradorId, elementosGuardados]);

  // Cargar propiedades del texto seleccionado (sin dependencia de 'elementos')
  useEffect(() => {
    if (!seleccionado) return;
    const elemento = elementos.find(el => el.id === seleccionado);
    if (!elemento || elemento.tipo !== 'texto') return;
    
    setColor(elemento.color);
    setFontSize(elemento.fontSize);
    setFontFamily(elemento.fontFamily || 'Poppins');
    setFontWeight(elemento.fontWeight || 'bold');
    setFontStyle(elemento.fontStyle || 'normal');
    setTextDecoration(elemento.textDecoration || 'none');
    setTextAlign(elemento.textAlign || 'center');
    setShadowBlur(elemento.shadowBlur || 4);
  }, [seleccionado]);

  // Aplicar cambios de estilo al elemento seleccionado (evita bucles)
  useEffect(() => {
    if (!seleccionado) return;
    const elemento = elementos.find(el => el.id === seleccionado);
    if (!elemento || elemento.tipo !== 'texto') return;

    const necesitaActualizar = 
      elemento.color !== colorTexto ||
      elemento.fontSize !== fontSize ||
      elemento.fontFamily !== fontFamily ||
      elemento.fontWeight !== fontWeight ||
      elemento.fontStyle !== fontStyle ||
      elemento.textDecoration !== textDecoration ||
      elemento.textAlign !== textAlign ||
      elemento.shadowBlur !== shadowBlur;

    if (necesitaActualizar) {
      actualizarEl(seleccionado, {
        color: colorTexto,
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        textDecoration,
        textAlign,
        shadowBlur,
      });
    }
  }, [colorTexto, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textAlign, shadowBlur, seleccionado, elementos]);

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
        alert('🔐 Debes iniciar sesión para guardar diseños');
        navigate('/login');
        return;
      }

      setSelec(null);
      await new Promise(r => setTimeout(r, 50));
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(escenaRef.current, {
        useCORS: true,
        scale: 1.5,
        backgroundColor: '#ffffff',
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.id_usuario;

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
        throw new Error('Error al subir la imagen');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('borradores')
        .getPublicUrl(filePath);

      if (editandoBorradorId) {
        try {
          const { data: borradorActual } = await axios.get(
            `http://localhost:5000/api/client/borradores/${editandoBorradorId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const oldImageUrl = borradorActual?.imagen_preview;
          if (oldImageUrl) {
            const urlParts = oldImageUrl.split('/public/borradores/');
            if (urlParts.length === 2) {
              const oldFilePath = urlParts[1];
              await supabase.storage.from('borradores').remove([oldFilePath]);
            }
          }
        } catch (err) {
          console.warn('No se pudo eliminar la imagen anterior');
        }
      }

      const varianteId = variante?.variante_id || variante?.id;
      const borradorData = {
        producto_id: productoId,
        variante_id: varianteId,
        nombre: `Diseño ${new Date().toLocaleString()}`,
        imagen_preview: publicUrl,
        elementos: elementos,
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editandoBorradorId) {
        await axios.put(`http://localhost:5000/api/client/borradores/${editandoBorradorId}`, borradorData, config);
        alert('✅ ¡Tu diseño ha sido actualizado con éxito!');
      } else {
        await axios.post('http://localhost:5000/api/client/borradores', borradorData, config);
        alert('🎉 ¡Diseño guardado en tu lista! Puedes verlo en "Mis diseños".');
      }

      navigate('/cliente/perfil', { state: { activeTab: 'mis-disenos' } });
    } catch (err) {
      console.error(err);
      alert('❌ No se pudo guardar el diseño. Por favor, inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const agregarAlCarrito = async () => {
    setGuardando(true);
    try {
      const token = getToken();
      if (!token) {
        alert('🔐 Debes iniciar sesión');
        navigate('/login');
        return;
      }

      // 1. Generar imagen del diseño
      const imagenUrl = await generarImagenDiseno();
      const blob = await (await fetch(imagenUrl)).blob();

      // 2. Subir imagen a Supabase Storage
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

      if (uploadError) throw new Error('Error al subir la imagen');

      const { data: { publicUrl } } = supabase.storage
        .from('borradores')
        .getPublicUrl(filePath);

      // 3. Preparar datos del producto personalizado
      const varianteId = variante?.variante_id || variante?.id;
      const textoPersonalizado = elementos
        .filter(el => el.tipo === 'texto')
        .map(t => t.contenido)
        .join(' | ');
      const precioAdicionalPersonalizacion = 50; // Ajusta según tu lógica de negocio

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 4. Crear producto personalizado en la BD
      const { data: productoPersonalizado } = await axios.post(
        'http://localhost:5000/api/client/productos/personalizados',
        {
          variante_id: varianteId,
          texto_personalizado: textoPersonalizado,
          imagen_personalizada_url: publicUrl,
          precio_adicional: precioAdicionalPersonalizacion,
        },
        config
      );

      // 5. Calcular precio unitario
      const precioBase = parseFloat(variante?.precio_base || 0);
      const precioAdicionalVariante = parseFloat(variante?.precio_adicional || 0);
      const precioUnitario = precioBase + precioAdicionalVariante + precioAdicionalPersonalizacion;

      // 6. Agregar al carrito (el backend ya maneja incremento si ya existe)
      const response = await axios.post(
        'http://localhost:5000/api/client/carrito',
        {
          producto_personalizado_id: productoPersonalizado.id,
          cantidad: 1,
          precio_unitario: precioUnitario,
        },
        config
      );

      // 7. Mensaje según respuesta del backend
      if (response.data.message?.includes('Cantidad actualizada')) {
        alert('🛒 Este diseño ya estaba en tu carrito. Se ha aumentado la cantidad.');
      } else {
        alert('🛒 ¡Producto agregado a tu carrito!');
      }
      navigate('/cliente/carrito');
    } catch (err) {
      console.error(err);
      alert('❌ No se pudo agregar al carrito. Intenta nuevamente.');
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
            {!editandoBorradorId && (
              <button className="btn-carrito" onClick={agregarAlCarrito} disabled={guardando}>
                🛒 Agregar al carrito
              </button>
            )}
            <button className="btn-cancelar" onClick={cancelar}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductoPersonalizador;