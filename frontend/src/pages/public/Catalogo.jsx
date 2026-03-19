// pages/public/Catalogo.jsx
// Una tarjeta por PRODUCTO — con colores, atributos y rango de precio
import { useState, useEffect, useCallback, useRef } from 'react';

const API = 'http://localhost:5000/api/catalogo';
const WA  = '521XXXXXXXXXX'; // ← tu número real

if (!document.getElementById('ng-cat-fonts')) {
  const l = document.createElement('link');
  l.id = 'ng-cat-fonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Open+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(l);
}

const C = {
  navy:'#004d40', green:'#00796b', greenL:'#e0f2f1',
  gold:'#c9a84c', white:'#fff', light:'#f4f6f9',
  text:'#1f2937', gray:'#475569', grayL:'#94a3b8',
  border:'#e2e8f0', red:'#dc2626',
};
const mont = (s,w=500,c=C.text)=>({fontFamily:"'Montserrat',sans-serif",fontSize:s,fontWeight:w,color:c});
const sans = (s='0.9rem',c=C.gray)=>({fontFamily:"'Open Sans',sans-serif",fontSize:s,color:c,lineHeight:1.6});

const FILTROS_BASE = {
  busqueda:'', categoria_id:'', subcategoria_id:'',
  marca_id:'', material_id:'', color_ids:[],
  precio_min:'', precio_max:'', atributos:{},
  orden:'reciente', pagina:1, por_pagina:12,
};

export default function Catalogo() {
  const [filtros,    setFiltros]    = useState(FILTROS_BASE);
  const [categorias, setCategorias] = useState([]);
  const [sideOpts,   setSideOpts]   = useState(null);
  const [resultado,  setResultado]  = useState(null);
  const [modal,      setModal]      = useState(null);
  const [varSel,     setVarSel]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [loadSide,   setLoadSide]   = useState(false);
  const [sidebar,    setSidebar]    = useState(true);
  const gridRef = useRef(null);

  // 1 — categorías (una sola vez)
  useEffect(() => {
    fetch(`${API}/categorias`).then(r=>r.json())
      .then(d => setCategorias(Array.isArray(d)?d:[]))
      .catch(()=>setCategorias([]));
  }, []);

  // 2 — filtros dependientes de categoría / subcategoría
  useEffect(() => {
    setLoadSide(true);
    const p = new URLSearchParams();
    if (filtros.categoria_id)    p.set('categoria_id',    filtros.categoria_id);
    if (filtros.subcategoria_id) p.set('subcategoria_id', filtros.subcategoria_id);
    fetch(`${API}/filtros?${p}`).then(r=>r.json())
      .then(d => {
        setSideOpts(d);
        if (d.precios) setFiltros(f => ({
          ...f,
          precio_min: f.precio_min==='' ? Math.floor(parseFloat(d.precios.precio_min)||0) : f.precio_min,
          precio_max: f.precio_max==='' ? Math.ceil(parseFloat(d.precios.precio_max)||9999)  : f.precio_max,
        }));
      })
      .catch(()=>setSideOpts({}))
      .finally(()=>setLoadSide(false));
  }, [filtros.categoria_id, filtros.subcategoria_id]);

  // 3 — buscar productos
  const buscar = useCallback(async (f) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (f.busqueda)          p.set('busqueda',        f.busqueda);
    if (f.categoria_id)      p.set('categoria_id',    f.categoria_id);
    if (f.subcategoria_id)   p.set('subcategoria_id', f.subcategoria_id);
    if (f.marca_id)          p.set('marca_id',        f.marca_id);
    if (f.material_id)       p.set('material_id',     f.material_id);
    if (f.color_ids?.length) p.set('color_ids',       f.color_ids.join(','));
    if (f.precio_min!=='')   p.set('precio_min',      f.precio_min);
    if (f.precio_max!=='')   p.set('precio_max',      f.precio_max);
    if (Object.keys(f.atributos||{}).length) p.set('atributos', JSON.stringify(f.atributos));
    p.set('orden',      f.orden);
    p.set('pagina',     f.pagina);
    p.set('por_pagina', f.por_pagina);
    try {
      const resp = await fetch(`${API}/productos?${p}`);
      const d    = await resp.json();
      setResultado(resp.ok && d.productos ? d : { productos:[], total:0, total_paginas:0 });
    } catch { setResultado({ productos:[], total:0, total_paginas:0 }); }
    setLoading(false);
  }, []);

  useEffect(() => { buscar(filtros); }, [filtros]);

  // helpers
  const set = (k,v) => setFiltros(f=>({...f,[k]:v,pagina:1}));
  const setCategoria = id => setFiltros(f=>({
    ...FILTROS_BASE, categoria_id:id,
    precio_min:'', precio_max:'',
  }));
  const toggleArr = (k,val) => setFiltros(f=>{
    const a=f[k]||[];
    return {...f,[k]:a.includes(val)?a.filter(x=>x!==val):[...a,val],pagina:1};
  });
  const toggleAtrib = (tipoId,valorId) => setFiltros(f=>{
    const prev=f.atributos[tipoId]||[];
    const next=prev.includes(valorId)?prev.filter(x=>x!==valorId):[...prev,valorId];
    const n={...f.atributos};
    if(!next.length) delete n[tipoId]; else n[tipoId]=next;
    return {...f,atributos:n,pagina:1};
  });
  const limpiar = () => setFiltros({
    ...FILTROS_BASE,
    categoria_id: filtros.categoria_id,
    precio_min: Math.floor(parseFloat(sideOpts?.precios?.precio_min)||0),
    precio_max: Math.ceil(parseFloat(sideOpts?.precios?.precio_max)||9999),
  });

  const abrirModal = async (id) => {
    try {
      const p = await fetch(`${API}/productos/${id}`).then(r=>r.json());
      setModal(p);
      setVarSel(p.variantes?.find(v=>v.stock>0) || p.variantes?.[0] || null);
    } catch {}
  };

  const totalActivos = [
    filtros.subcategoria_id, filtros.marca_id, filtros.material_id,
    ...(filtros.color_ids||[]),
    ...Object.values(filtros.atributos||{}).flat(),
  ].filter(Boolean).length;

  return (
    <div style={{fontFamily:"'Open Sans',sans-serif",background:C.light,minHeight:'100vh'}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .pcard:hover .pimg{transform:scale(1.05)!important}
        .pcard:hover .poverlay{opacity:1!important}
      `}</style>

      {/* ── HEADER CON BÚSQUEDA Y CATEGORÍAS ── */}
      <div style={{background:C.navy,padding:'2rem 5vw 0'}}>
        <h1 style={{...mont('clamp(1.4rem,3vw,2rem)',800,'#fff'),margin:'0 0 0.3rem'}}>
          Catálogo de Productos
        </h1>
        <p style={{...sans('0.87rem','rgba(255,255,255,0.6)'),margin:'0 0 1rem'}}>
          Todos nuestros artículos son personalizables.
          {resultado && !loading && <span> — <strong style={{color:'#fff'}}>{resultado.total}</strong> producto{resultado.total!==1?'s':''}</span>}
        </p>

        {/* Búsqueda */}
        <div style={{display:'flex',gap:'8px',maxWidth:'460px',marginBottom:'1.2rem'}}>
          <input value={filtros.busqueda}
            onChange={e=>set('busqueda',e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&buscar(filtros)}
            placeholder="Buscar producto..."
            style={{flex:1,padding:'9px 14px',border:'none',borderRadius:'6px',
              fontSize:'0.9rem',outline:'none',fontFamily:"'Open Sans',sans-serif"}} />
          {filtros.busqueda&&(
            <button onClick={()=>set('busqueda','')}
              style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',
                padding:'0 12px',borderRadius:'6px',cursor:'pointer'}}>✕</button>
          )}
        </div>

        {/* Tabs de categorías */}
        <div style={{display:'flex',gap:'2px',overflowX:'auto',paddingBottom:'0'}}>
          {[{id:'',nombre:'Todas'}, ...categorias].map(c=>{
            const activo = String(filtros.categoria_id)===String(c.id);
            return (
              <button key={c.id} onClick={()=>setCategoria(String(c.id))}
                style={{padding:'10px 18px',borderRadius:'8px 8px 0 0',fontSize:'0.83rem',fontWeight:600,
                  border:'none',cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.15s',
                  background: activo?C.white:'transparent',
                  color: activo?C.navy:'rgba(255,255,255,0.75)',
                  borderBottom: activo?`3px solid ${C.gold}`:'3px solid transparent',
                  fontFamily:"'Montserrat',sans-serif"}}>
                {c.nombre}
                
              </button>
            );
          })}
        </div>
      </div>

      <div style={{display:'flex',maxWidth:'1400px',margin:'0 auto',
        padding:'1.2rem 5vw',gap:'1.5rem',alignItems:'flex-start'}}>

        {/* ══ SIDEBAR ══ */}
        {sidebar&&(
          <aside style={{width:'252px',flexShrink:0,position:'sticky',top:'1rem'}}>
            <div style={{background:C.white,borderRadius:'12px',
              boxShadow:'0 1px 4px rgba(0,0,0,.07)',overflow:'hidden'}}>
              <div style={{background:C.navy,padding:'0.85rem 1.1rem',
                display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={mont('0.85rem',700,'#fff')}>🔎 Filtros</span>
                {totalActivos>0&&(
                  <button onClick={limpiar}
                    style={{background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',
                      padding:'3px 9px',borderRadius:'20px',cursor:'pointer',fontSize:'0.71rem',fontWeight:600}}>
                    Limpiar ({totalActivos})
                  </button>
                )}
              </div>

              <div style={{padding:'0.65rem 1rem',overflowY:'auto',maxHeight:'80vh'}}>

                {/* Ordenar */}
                <SideBloque titulo="Ordenar por">
                  <select value={filtros.orden} onChange={e=>set('orden',e.target.value)}
                    style={{width:'100%',padding:'7px 9px',border:`1px solid ${C.border}`,
                      borderRadius:'6px',fontSize:'0.83rem',color:C.text,background:C.white,
                      fontFamily:"'Open Sans',sans-serif"}}>
                    <option value="reciente">Más recientes</option>
                    <option value="precio_asc">Precio: menor a mayor</option>
                    <option value="precio_desc">Precio: mayor a menor</option>
                    <option value="nombre_asc">Nombre A–Z</option>
                  </select>
                </SideBloque>

                {loadSide&&<p style={{...sans('0.76rem',C.grayL),textAlign:'center',padding:'0.5rem'}}>Cargando...</p>}

                {/* Subcategorías */}
                {filtros.categoria_id&&sideOpts?.subcategorias?.length>0&&(
                  <SideBloque titulo="Subcategoría">
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                      <Chip label="Todas" sel={!filtros.subcategoria_id} onClick={()=>set('subcategoria_id','')} />
                      {sideOpts.subcategorias.map(s=>(
                        <Chip key={s.id} label={s.nombre}
                          sel={String(filtros.subcategoria_id)===String(s.id)}
                          onClick={()=>set('subcategoria_id',String(s.id))} />
                      ))}
                    </div>
                  </SideBloque>
                )}

                {/* Precio */}
                {sideOpts?.precios&&(
                  <SideBloque titulo="Precio ($)">
                    <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                      <input type="number" placeholder="Mín" value={filtros.precio_min}
                        onChange={e=>set('precio_min',e.target.value)}
                        style={{width:'80px',padding:'6px 7px',border:`1px solid ${C.border}`,
                          borderRadius:'6px',fontSize:'0.81rem'}} />
                      <span style={{color:C.grayL}}>—</span>
                      <input type="number" placeholder="Máx" value={filtros.precio_max}
                        onChange={e=>set('precio_max',e.target.value)}
                        style={{width:'80px',padding:'6px 7px',border:`1px solid ${C.border}`,
                          borderRadius:'6px',fontSize:'0.81rem'}} />
                    </div>
                  </SideBloque>
                )}

                {/* Colores */}
                {sideOpts?.colores?.length>0&&(
                  <SideBloque titulo="Color" badge={(filtros.color_ids||[]).length}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                      {sideOpts.colores.map(c=>(
                        <Chip key={c.id} label={c.nombre}
                          sel={(filtros.color_ids||[]).includes(c.id)}
                          onClick={()=>toggleArr('color_ids',c.id)} />
                      ))}
                    </div>
                  </SideBloque>
                )}

                {/* Atributos dinámicos (Talla, Género, Capacidad…) */}
                {sideOpts?.tiposAtributo?.map(tipo=>(
                  <SideBloque key={tipo.id} titulo={tipo.nombre}
                    badge={(filtros.atributos[tipo.id]||[]).length}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                      {tipo.valores.map(v=>(
                        <Chip key={v.id} label={v.valor}
                          sel={(filtros.atributos[tipo.id]||[]).includes(v.id)}
                          onClick={()=>toggleAtrib(tipo.id,v.id)} />
                      ))}
                    </div>
                  </SideBloque>
                ))}

                {/* Marca */}
                {sideOpts?.marcas?.length>0&&(
                  <SideBloque titulo="Marca" badge={filtros.marca_id?1:0}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                      <Chip label="Todas" sel={!filtros.marca_id} onClick={()=>set('marca_id','')} />
                      {sideOpts.marcas.map(m=>(
                        <Chip key={m.id} label={m.nombre}
                          sel={String(filtros.marca_id)===String(m.id)}
                          onClick={()=>set('marca_id',String(m.id))} />
                      ))}
                    </div>
                  </SideBloque>
                )}

                {/* Material */}
                {sideOpts?.materiales?.length>0&&(
                  <SideBloque titulo="Material" badge={filtros.material_id?1:0}>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                      <Chip label="Todos" sel={!filtros.material_id} onClick={()=>set('material_id','')} />
                      {sideOpts.materiales.map(m=>(
                        <Chip key={m.id} label={m.nombre}
                          sel={String(filtros.material_id)===String(m.id)}
                          onClick={()=>set('material_id',String(m.id))} />
                      ))}
                    </div>
                  </SideBloque>
                )}

              </div>
            </div>
          </aside>
        )}

        {/* ══ GRID ══ */}
        <main style={{flex:1,minWidth:0}} ref={gridRef}>
          {/* Barra superior */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
            marginBottom:'1rem',flexWrap:'wrap',gap:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <button onClick={()=>setSidebar(s=>!s)}
                style={{background:C.white,border:`1px solid ${C.border}`,padding:'7px 12px',
                  borderRadius:'6px',cursor:'pointer',fontSize:'0.81rem',color:C.gray,fontWeight:600,
                  fontFamily:"'Open Sans',sans-serif"}}>
                {sidebar?'◀ Ocultar':'▶ Filtros'}
              </button>
            </div>
            {/* Chips activos */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
              {(filtros.color_ids||[]).map(cid=>{
                const col=sideOpts?.colores?.find(c=>c.id===cid);
                return col?<ActiveChip key={cid} label={col.nombre} onRemove={()=>toggleArr('color_ids',cid)}/>:null;
              })}
              {Object.entries(filtros.atributos||{}).flatMap(([tid,vids])=>
                vids.map(vid=>{
                  const tipo=sideOpts?.tiposAtributo?.find(t=>t.id===parseInt(tid));
                  const val=tipo?.valores?.find(v=>v.id===vid);
                  return val?<ActiveChip key={`${tid}-${vid}`}
                    label={`${tipo.nombre}: ${val.valor}`}
                    onRemove={()=>toggleAtrib(parseInt(tid),vid)}/>:null;
                })
              )}
              {totalActivos>1&&(
                <button onClick={limpiar}
                  style={{padding:'3px 9px',borderRadius:'20px',border:`1px solid ${C.border}`,
                    background:'transparent',color:C.grayL,cursor:'pointer',
                    fontSize:'0.71rem',fontWeight:600,fontFamily:"'Open Sans',sans-serif"}}>
                  Limpiar todo
                </button>
              )}
            </div>
          </div>

          {loading ? <Skeleton />
            : !resultado?.productos?.length ? <SinResultados onLimpiar={limpiar} />
            : (
              <>
                <div style={{display:'grid',
                  gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',
                  gap:'1.2rem',marginBottom:'2rem'}}>
                  {resultado.productos.map((p,i)=>(
                    <TarjetaProducto key={p.id} producto={p} idx={i}
                      onClick={()=>abrirModal(p.id)} />
                  ))}
                </div>
                {resultado.total_paginas>1&&(
                  <Paginacion pagina={filtros.pagina} total={resultado.total_paginas}
                    onChange={n=>{setFiltros(f=>({...f,pagina:n}));
                      gridRef.current?.scrollIntoView({behavior:'smooth',block:'start'});}} />
                )}
              </>
            )
          }
        </main>
      </div>

      {modal&&<ModalDetalle producto={modal} varSel={varSel} setVarSel={setVarSel} onClose={()=>setModal(null)}/>}
    </div>
  );
}

/* ── Sidebar helpers ── */
function SideBloque({titulo,children,badge=0}){
  const [open,setOpen]=useState(true);
  return(
    <div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:'10px',marginBottom:'10px'}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          width:'100%',background:'none',border:'none',cursor:'pointer',
          padding:'3px 0',marginBottom:open?'8px':'0'}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
          <span style={{...mont('0.78rem',700,C.navy),textTransform:'uppercase',letterSpacing:'0.4px'}}>{titulo}</span>
          {badge>0&&<span style={{background:C.green,color:'#fff',fontSize:'0.65rem',fontWeight:700,
            padding:'1px 5px',borderRadius:'10px'}}>{badge}</span>}
        </div>
        <span style={{color:C.grayL,fontSize:'0.78rem'}}>{open?'−':'+'}</span>
      </button>
      {open&&children}
    </div>
  );
}

function Chip({label,sel,onClick}){
  return(
    <button onClick={onClick}
      style={{padding:'4px 10px',borderRadius:'20px',fontSize:'0.77rem',fontWeight:sel?600:400,
        border:`1.5px solid ${sel?C.navy:C.border}`,
        background:sel?C.navy:'transparent',color:sel?'#fff':C.gray,
        cursor:'pointer',transition:'all 0.12s',fontFamily:"'Open Sans',sans-serif"}}>
      {label}
    </button>
  );
}

function ActiveChip({label,onRemove}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 9px',
      background:C.greenL,color:C.navy,borderRadius:'20px',fontSize:'0.75rem',fontWeight:600}}>
      {label}
      <button onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',
        color:C.navy,fontSize:'0.82rem',lineHeight:1,padding:0}}>✕</button>
    </span>
  );
}

/* ── TARJETA DE PRODUCTO ── */
function TarjetaProducto({producto:p,idx,onClick}){
  const [h,setH] = useState(false);
  const [imgIdx, setImgIdx] = useState(0); // color activo para preview

  // Imagen: del color en preview o la imagen principal
  const colores = p.colores || [];
  const imgActual = colores[imgIdx]?.imagen || p.imagen_url || null;
  const imgSrc = imgActual?.startsWith('http') ? imgActual : imgActual ? `http://localhost:5000${imgActual}` : null;

  // Agrupar atributos por tipo
  const tiposMap = {};
  (p.atributos||[]).forEach(a=>{
    if(!tiposMap[a.tipo_nombre]) tiposMap[a.tipo_nombre]=new Set();
    tiposMap[a.tipo_nombre].add(a.valor);
  });

  const precioMin = parseFloat(p.precio_min||p.precio_base||0);
  const precioMax = parseFloat(p.precio_max||p.precio_base||0);
  const mismoP    = Math.abs(precioMax-precioMin)<0.01;

  return(
    <div className="pcard"
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:C.white,borderRadius:'12px',overflow:'hidden',
        boxShadow:h?'0 8px 28px rgba(0,0,0,0.13)':'0 1px 6px rgba(0,0,0,0.07)',
        transform:h?'translateY(-4px)':'none',transition:'all 0.2s',cursor:'pointer',
        animation:`fadeUp 0.42s ease ${idx*0.04}s both`}}
      onClick={onClick}>

      {/* Imagen */}
      <div style={{height:'200px',background:'#f8f9fb',overflow:'hidden',position:'relative'}}>
        {imgSrc
          ? <img className="pimg" src={imgSrc} alt={p.nombre}
              style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.35s'}} />
          : <div style={{height:'100%',display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:'3rem',opacity:0.1}}>🛍️</div>
        }
        <div style={{position:'absolute',top:'8px',left:'8px',background:C.gold,
          color:'#fff',fontSize:'0.63rem',fontWeight:700,padding:'3px 8px',borderRadius:'3px',
          fontFamily:"'Montserrat',sans-serif",letterSpacing:'0.05em',textTransform:'uppercase'}}>
          Personalizable
        </div>
        <div className="poverlay"
          style={{position:'absolute',inset:0,background:'rgba(0,77,64,0.6)',
            display:'flex',alignItems:'center',justifyContent:'center',opacity:0,transition:'opacity 0.2s'}}>
          <span style={{color:'#fff',fontWeight:700,fontSize:'0.86rem',
            border:'2px solid rgba(255,255,255,0.8)',padding:'7px 16px',borderRadius:'4px',
            fontFamily:"'Montserrat',sans-serif"}}>Ver detalle</span>
        </div>
      </div>

      {/* Info */}
      <div style={{padding:'0.9rem'}}>
        <span style={{fontSize:'0.67rem',color:C.gold,fontWeight:700,
          fontFamily:"'Montserrat',sans-serif",letterSpacing:'0.1em',textTransform:'uppercase'}}>
          {p.categoria_nombre}
        </span>
        <h3 style={{...mont('0.92rem',700,C.navy),margin:'3px 0 8px',lineHeight:1.3}}>{p.nombre}</h3>

        {/* Colores — chips clickeables que cambian la imagen */}
        {colores.length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'8px'}}>
            {colores.map((col,ci)=>{
              const isActive = ci===imgIdx;
              return(
                <button key={col.id}
                  onClick={e=>{e.stopPropagation();setImgIdx(ci);}}
                  title={col.nombre}
                  style={{padding:'3px 9px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:600,
                    border:`1.5px solid ${isActive?C.navy:C.border}`,
                    background:isActive?C.greenL:'transparent',
                    color:isActive?C.navy:C.gray,cursor:'pointer',transition:'all 0.12s',
                    fontFamily:"'Open Sans',sans-serif"}}>
                  {col.nombre}
                </button>
              );
            })}
            {colores.length>4&&(
              <span style={{fontSize:'0.72rem',color:C.grayL,alignSelf:'center'}}>+{colores.length-4}</span>
            )}
          </div>
        )}

        {/* Atributos por tipo (Talla, Capacidad, etc.) */}
        {Object.entries(tiposMap).slice(0,2).map(([tipo,vals])=>(
          <div key={tipo} style={{marginBottom:'4px'}}>
            <span style={{fontSize:'0.66rem',color:C.grayL,fontWeight:700}}>{tipo}: </span>
            {[...vals].slice(0,5).map(v=>(
              <span key={v} style={{fontSize:'0.67rem',color:C.navy,
                background:C.greenL,padding:'1px 6px',borderRadius:'8px',
                marginRight:'3px',fontWeight:600}}>{v}</span>
            ))}
            {vals.size>5&&<span style={{fontSize:'0.67rem',color:C.grayL}}>+{vals.size-5}</span>}
          </div>
        ))}
        {Object.keys(tiposMap).length>2&&(
          <p style={{fontSize:'0.67rem',color:C.grayL,margin:'3px 0 0'}}>
            +{Object.keys(tiposMap).length-2} atributos más
          </p>
        )}

        {/* Precio */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          paddingTop:'8px',borderTop:`1px solid ${C.border}`,marginTop:'8px'}}>
          <div>
            <div style={{fontSize:'0.67rem',color:C.grayL}}>
              {mismoP?'Precio':'Desde'}
            </div>
            <div style={{...mont('1.02rem',800,C.navy)}}>
              ${precioMin.toFixed(2)}
              {!mismoP&&<span style={{fontSize:'0.75rem',color:C.grayL,fontWeight:400}}> – ${precioMax.toFixed(2)}</span>}
            </div>
          </div>
          <span style={{fontSize:'0.7rem',color:C.grayL}}>
            {p.num_variantes} variante{p.num_variantes!=1?'s':''}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── MODAL DETALLE ── */
function ModalDetalle({producto:p, varSel, setVarSel, onClose}){
  const precio = parseFloat(p.precio_base)+parseFloat(varSel?.precio_adicional||0);

  // Estado de selección en el modal
  const [colorSel, setColorSel] = useState(varSel?.color_id||null);
  const [attrSel,  setAttrSel]  = useState({});

  // Sincronizar colorSel cuando cambia varSel desde afuera
  useEffect(()=>{
    if(varSel) setColorSel(varSel.color_id);
  },[varSel]);

  const elegirVariante = (nuevoColorId, nuevoAttrSel) => {
    const cId  = nuevoColorId  ?? colorSel;
    const aSel = nuevoAttrSel ?? attrSel;
    const match = p.variantes?.find(v=>{
      const cOk = !cId || v.color_id===cId;
      const aOk = Object.entries(aSel).every(([tid,vid])=>
        (v.atributos||[]).some(a=>a.tipo_id===parseInt(tid)&&a.valor_id===vid));
      return cOk && aOk;
    });
    if(match) setVarSel(match);
  };

  const imgSrc = (varSel?.imagen_url||p.imagen_url||'');
  const img    = imgSrc.startsWith('http') ? imgSrc : imgSrc ? `http://localhost:5000${imgSrc}` : null;
  const waMsg  = `Hola NovaGraf 👋 Me interesa: *${p.nombre}*${varSel?` — ${varSel.sku||''}`:''} ¿Me pueden cotizar?`;

  return(
    <div onClick={onClose}
      style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.72)',zIndex:1000,
        display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:C.white,borderRadius:'14px',maxWidth:'820px',width:'100%',
          maxHeight:'92vh',overflow:'auto',display:'grid',gridTemplateColumns:'1fr 1fr',
          boxShadow:'0 24px 64px rgba(0,0,0,0.3)'}}>

        {/* Imagen */}
        <div style={{background:C.light,display:'flex',alignItems:'center',justifyContent:'center',
          padding:'2rem',borderRadius:'14px 0 0 14px',minHeight:'280px'}}>
          {img
            ? <img src={img} alt={p.nombre} style={{maxWidth:'100%',maxHeight:'280px',objectFit:'contain'}} />
            : <span style={{fontSize:'5rem',opacity:0.08}}>🛍️</span>
          }
        </div>

        {/* Contenido */}
        <div style={{padding:'1.8rem',display:'flex',flexDirection:'column',overflow:'auto'}}>
          <button onClick={onClose}
            style={{alignSelf:'flex-end',background:'none',border:'none',
              fontSize:'1.3rem',cursor:'pointer',color:C.grayL,marginBottom:'4px'}}>✕</button>

          {p.categoria_nombre&&(
            <span style={{fontSize:'0.69rem',color:C.gold,fontWeight:700,
              letterSpacing:'0.1em',textTransform:'uppercase',
              fontFamily:"'Montserrat',sans-serif",marginBottom:'5px',display:'block'}}>
              {p.categoria_nombre}{p.subcategoria_nombre?` · ${p.subcategoria_nombre}`:''}
            </span>
          )}
          <h2 style={{...mont('1.3rem',800,C.navy),marginBottom:'0.4rem'}}>{p.nombre}</h2>
          {p.descripcion&&<p style={{...sans('0.84rem'),marginBottom:'1rem'}}>{p.descripcion}</p>}

          {/* Colores */}
          {p.colores?.length>0&&(
            <div style={{marginBottom:'1rem'}}>
              <p style={{...mont('0.69rem',700,C.navy),letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'7px'}}>
                Color{varSel?.color?` — ${varSel.color}`:''}
              </p>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                {p.colores.map(c=>{
                  const sel = colorSel===c.id;
                  return(
                    <button key={c.id}
                      onClick={()=>{setColorSel(c.id); elegirVariante(c.id,attrSel);}}
                      style={{padding:'5px 13px',borderRadius:'4px',
                        border:`2px solid ${sel?C.navy:C.border}`,
                        background:sel?C.greenL:'#fff',cursor:'pointer',
                        fontSize:'0.8rem',color:sel?C.navy:C.gray,
                        fontWeight:sel?700:400,fontFamily:"'Open Sans',sans-serif"}}>
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Atributos (Talla, Género, Capacidad…) */}
          {p.tipos_atributo?.map(tipo=>{
            // Valores disponibles para el color seleccionado
            const disponibles = [...new Map(
              (p.variantes||[])
                .filter(v=>!colorSel||v.color_id===colorSel)
                .flatMap(v=>(v.atributos||[]).filter(a=>a.tipo_id===tipo.id))
                .map(a=>[a.valor_id,{id:a.valor_id,valor:a.valor,
                  stock:(p.variantes||[]).find(v=>
                    (!colorSel||v.color_id===colorSel)&&
                    (v.atributos||[]).some(a=>a.tipo_id===tipo.id&&a.valor_id===a.valor_id)
                  )?.stock||0}])
            ).values()];

            return(
              <div key={tipo.id} style={{marginBottom:'1rem'}}>
                <p style={{...mont('0.69rem',700,C.navy),letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:'7px'}}>
                  {tipo.nombre}
                </p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {tipo.valores.map(v=>{
                    const sel = attrSel[tipo.id]===v.id;
                    // Buscar si hay variante con este color + este valor
                    const tieneVariante = (p.variantes||[]).some(pv=>
                      (!colorSel||pv.color_id===colorSel)&&
                      (pv.atributos||[]).some(a=>a.tipo_id===tipo.id&&a.valor_id===v.id));
                    const tieneStock = (p.variantes||[]).some(pv=>
                      (!colorSel||pv.color_id===colorSel)&&
                      (pv.atributos||[]).some(a=>a.tipo_id===tipo.id&&a.valor_id===v.id)&&
                      pv.stock>0);
                    return(
                      <button key={v.id}
                        onClick={()=>{
                          if(!tieneVariante) return;
                          const nuevoAttr={...attrSel,[tipo.id]:v.id};
                          setAttrSel(nuevoAttr);
                          elegirVariante(colorSel,nuevoAttr);
                        }}
                        title={!tieneVariante?'No disponible':!tieneStock?'Sin stock':''}
                        style={{padding:'5px 13px',borderRadius:'4px',
                          border:`2px solid ${sel?C.navy:tieneVariante?C.border:'#f3f4f6'}`,
                          background:sel?C.greenL:tieneVariante?'#fff':'#f9fafb',
                          cursor:tieneVariante?'pointer':'not-allowed',
                          opacity:tieneVariante?1:0.4,
                          fontSize:'0.8rem',color:sel?C.navy:C.gray,
                          fontWeight:sel?700:400,fontFamily:"'Open Sans',sans-serif",
                          textDecoration:tieneVariante?'none':'line-through'}}>
                        {v.valor}
                        {tieneVariante&&!tieneStock&&<span style={{fontSize:'0.6rem',color:C.red,marginLeft:'3px'}}>·0</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Precio + CTA */}
          <div style={{marginTop:'auto',paddingTop:'1rem',borderTop:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'1rem'}}>
              <div>
                <div style={{...sans('0.72rem',C.grayL),marginBottom:'1px'}}>Precio</div>
                <div style={{...mont('1.8rem',800,C.gold)}}>${precio.toFixed(2)}</div>
              </div>
              {varSel&&(
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.77rem',color:C.navy,fontWeight:600}}>{varSel.sku}</div>
                  <div style={{...sans('0.71rem',varSel.stock>0?C.green:C.red),fontWeight:600}}>
                    {varSel.stock>0?`✓ ${varSel.stock} disponibles`:'✕ Sin stock'}
                  </div>
                </div>
              )}
            </div>
            <a href={`https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`}
              target="_blank" rel="noreferrer"
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'9px',
                background:'#25d366',color:'#fff',padding:'12px',borderRadius:'7px',
                textDecoration:'none',fontFamily:"'Montserrat',sans-serif",fontWeight:700,
                fontSize:'0.9rem',width:'100%',boxSizing:'border-box'}}
              onMouseEnter={e=>e.currentTarget.style.background='#1ebe5d'}
              onMouseLeave={e=>e.currentTarget.style.background='#25d366'}>
              <WaIcon/> Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Paginacion({pagina,total,onChange}){
  const pages=[];
  const from=Math.max(1,pagina-2),to=Math.min(total,pagina+2);
  if(from>1){pages.push(1);if(from>2)pages.push('...');}
  for(let i=from;i<=to;i++)pages.push(i);
  if(to<total){if(to<total-1)pages.push('...');pages.push(total);}
  const B=({l,t,d})=>(<button onClick={()=>!d&&onChange(t)} disabled={d}
    style={{padding:'6px 12px',borderRadius:'6px',border:`1px solid ${C.border}`,
      background:d?C.light:C.white,color:d?C.grayL:C.text,
      cursor:d?'default':'pointer',fontSize:'0.81rem',fontWeight:600,
      fontFamily:"'Montserrat',sans-serif"}}>{l}</button>);
  return(
    <div style={{display:'flex',justifyContent:'center',gap:'5px',flexWrap:'wrap',padding:'1rem 0'}}>
      <B l="← Ant." t={pagina-1} d={pagina===1}/>
      {pages.map((p,i)=>p==='...'
        ?<span key={`e${i}`} style={{padding:'6px 2px',color:C.grayL}}>…</span>
        :<button key={p} onClick={()=>onChange(p)}
          style={{padding:'6px 11px',borderRadius:'6px',fontSize:'0.81rem',
            border:`1px solid ${p===pagina?C.navy:C.border}`,
            background:p===pagina?C.navy:C.white,color:p===pagina?'#fff':C.text,
            cursor:'pointer',fontFamily:"'Montserrat',sans-serif",fontWeight:600}}>{p}</button>
      )}
      <B l="Sig. →" t={pagina+1} d={pagina===total}/>
    </div>
  );
}

function Skeleton(){
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1.2rem'}}>
      {[...Array(8)].map((_,i)=>(
        <div key={i} style={{borderRadius:'12px',height:'320px',
          background:'linear-gradient(90deg,#e9ecef 25%,#f3f4f6 50%,#e9ecef 75%)',
          backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite'}}/>
      ))}
    </div>
  );
}

function SinResultados({onLimpiar}){
  return(
    <div style={{textAlign:'center',padding:'4rem 2rem',background:C.white,
      borderRadius:'12px',boxShadow:'0 1px 6px rgba(0,0,0,.06)'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div>
      <h3 style={{...mont('1rem',700,C.navy),marginBottom:'0.5rem'}}>Sin resultados</h3>
      <p style={{...sans('0.87rem'),marginBottom:'1.2rem'}}>Intenta ajustar los filtros.</p>
      <button onClick={onLimpiar}
        style={{background:C.navy,color:'#fff',border:'none',padding:'9px 22px',
          borderRadius:'6px',cursor:'pointer',fontFamily:"'Montserrat',sans-serif",
          fontSize:'0.85rem',fontWeight:600}}>Limpiar filtros</button>
    </div>
  );
}

function WaIcon(){
  return(
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.117 1.524 5.847L.057 23.571a.75.75 0 0 0 .94.94l5.724-1.467A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.897 0-3.673-.502-5.205-1.381l-.374-.213-3.896.998.998-3.896-.213-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}