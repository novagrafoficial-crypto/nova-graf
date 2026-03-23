import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/admin/productos";
const API_BASE = "http://localhost:5000/api/admin";

const S = {
  page: { fontFamily: "'Segoe UI', sans-serif", background: "#f1f5f9", minHeight: "100vh", padding: "2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#1e293b", margin: 0 },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnSecondary: { background: "#fff", color: "#475569", border: "1px solid #cbd5e1", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
  btnDanger: { background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" },
  btnSuccess: { background: "#dcfce7", color: "#16a34a", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" },
  card: { background: "#fff", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)", marginBottom: "1.5rem" },
  label: { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", color: "#1e293b", background: "#fff" },
  select: { width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: "8px", fontSize: "0.9rem", boxSizing: "border-box", color: "#1e293b", background: "#fff" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
  error: { background: "#fee2e2", color: "#dc2626", padding: "10px 16px", borderRadius: "8px", fontSize: "0.88rem", marginBottom: "1rem" },
  steps: { display: "flex", marginBottom: "2rem" },
  step: (active, done) => ({
    flex: 1, padding: "12px", textAlign: "center", fontSize: "0.85rem", fontWeight: 600,
    background: done ? "#4f46e5" : active ? "#eef2ff" : "#f8fafc",
    color: done ? "#fff" : active ? "#4f46e5" : "#94a3b8",
    borderBottom: active || done ? "3px solid #4f46e5" : "3px solid #e2e8f0",
  }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.87rem" },
  th: { padding: "10px 12px", textAlign: "left", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "0.8rem", borderBottom: "1px solid #e2e8f0" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", verticalAlign: "middle" },
  chip: (sel) => ({
    display: "inline-flex", alignItems: "center", gap: "5px",
    padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
    fontSize: "0.82rem", fontWeight: 600, userSelect: "none",
    border: sel ? "2px solid #4f46e5" : "2px solid #e2e8f0",
    background: sel ? "#eef2ff" : "#fff",
    color: sel ? "#4f46e5" : "#64748b",
    transition: "all 0.12s",
  }),
};

function cartesiano(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restCombinations = cartesiano(rest);
  return first.flatMap(item => restCombinations.map(combo => [item, ...combo]));
}

function generarSKU(partes) {
  return partes.map(p => p.toString().toUpperCase().replace(/\s+/g, "").substring(0, 4)).join("-");
}

export default function AdminProductos() {
  const [vista, setVista] = useState("lista");
  const [productos, setProductos] = useState([]);
  const [productoActivo, setProductoActivo] = useState(null);
  const [catalogos, setCatalogos] = useState({ colores: [], materiales: [], tiposAtributo: [] });
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    setLoading(true);
    try {
      const [rProd, rCat, rSub, rMar, rCat2] = await Promise.all([
        fetch(API).then(r => r.json()),
        fetch(`${API_BASE}/categorias`).then(r => r.json()),
        fetch(`${API_BASE}/subcategorias`).then(r => r.json()),
        fetch(`${API_BASE}/marcas`).then(r => r.json()),
        fetch(`${API}/catalogos`).then(r => r.json()),
      ]);
      setProductos(Array.isArray(rProd) ? rProd : []);
      setCategorias(Array.isArray(rCat) ? rCat : []);
      setSubcategorias(Array.isArray(rSub) ? rSub : []);
      setMarcas(Array.isArray(rMar) ? rMar : []);
      setCatalogos(rCat2);
    } catch { setError("Error al cargar datos"); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const verDetalle = async (id) => {
    const r = await fetch(`${API}/${id}`);
    const d = await r.json();
    setProductoActivo(d);
    setVista("detalle");
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar este producto y todas sus variantes?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div style={S.page}>
      {vista === "lista" && (
        <ListaProductos productos={productos} loading={loading} error={error}
          onCrear={() => setVista("crear")} onDetalle={verDetalle} onEliminar={eliminarProducto} />
      )}
      {vista === "crear" && (
        <WizardCrear catalogos={catalogos} categorias={categorias} subcategorias={subcategorias} marcas={marcas}
          onGuardado={() => { cargar(); setVista("lista"); }}
          onCancelar={() => setVista("lista")} />
      )}
      {vista === "detalle" && productoActivo && (
        <DetalleProducto producto={productoActivo} catalogos={catalogos}
          onActualizar={() => verDetalle(productoActivo.id)}
          onVolver={() => { setVista("lista"); setProductoActivo(null); }} />
      )}
    </div>
  );
}

function ListaProductos({ productos, loading, error, onCrear, onDetalle, onEliminar }) {
  const badge = (color, text) => (
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"20px", fontSize:"0.75rem", fontWeight:600,
      background: color==="green"?"#dcfce7":color==="red"?"#fee2e2":"#f1f5f9",
      color: color==="green"?"#16a34a":color==="red"?"#dc2626":"#475569" }}>{text}</span>
  );
  return (
    <>
      <div style={S.header}>
        <h1 style={S.title}>📦 Productos</h1>
        <button style={S.btnPrimary} onClick={onCrear}>+ Nuevo producto</button>
      </div>
      {error && <div style={S.error}>{error}</div>}
      {loading ? <p style={{ color:"#94a3b8" }}>Cargando...</p> : (
        <div style={S.card}>
          <table style={S.table}>
            <thead><tr>
              {["ID","Nombre","Categoría","Marca","Precio base","Variantes","Stock","Estado","Acciones"].map(h=>
                <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {productos.length === 0
                ? <tr><td colSpan={9} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:"2rem"}}>No hay productos aún</td></tr>
                : productos.map(p => (
                  <tr key={p.id}>
                    <td style={S.td}>{p.id}</td>
                    <td style={{...S.td,fontWeight:600}}>{p.nombre}</td>
                    <td style={S.td}>{p.categoria_nombre}</td>
                    <td style={S.td}>{p.marca_nombre||"—"}</td>
                    <td style={S.td}>${parseFloat(p.precio_base).toFixed(2)}</td>
                    <td style={{...S.td,textAlign:"center"}}>{p.num_variantes}</td>
                    <td style={S.td}>{badge(p.stock_total>0?"green":"red",`${p.stock_total} uds`)}</td>
                    <td style={S.td}>{badge(p.activo?"green":"red",p.activo?"Activo":"Inactivo")}</td>
                    <td style={{...S.td,display:"flex",gap:"6px"}}>
                      <button style={S.btnPrimary} onClick={()=>onDetalle(p.id)}>Ver</button>
                      <button style={S.btnDanger} onClick={()=>onEliminar(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function WizardCrear({ catalogos, categorias, subcategorias, marcas, onGuardado, onCancelar }) {
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [base, setBase] = useState({ nombre:"", descripcion:"", precio_base:"", categoria_id:"", subcategoria_id:"", marca_id:"", material_id:"" });
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [tiposSeleccionados, setTiposSeleccionados] = useState([]);
  const [coloresSeleccionados, setColoresSeleccionados] = useState([]);
  const [atributosSeleccionados, setAtributosSeleccionados] = useState({});
  const [variantesGeneradas, setVariantesGeneradas] = useState([]);
  const [precioBase, setPrecioBase] = useState(0);
  const [stockBase, setStockBase] = useState(0);
  const [stockMinBase, setStockMinBase] = useState(5);

  const handleBase = (k, v) => setBase(b => ({ ...b, [k]: v }));
  const toggleColor = (color) => setColoresSeleccionados(prev => prev.find(c=>c.id===color.id) ? prev.filter(c=>c.id!==color.id) : [...prev,color]);
  const toggleAtributo = (tipoId, valor) => setAtributosSeleccionados(prev => {
    const actuales = prev[tipoId] || [];
    const existe = actuales.find(v=>v.id===valor.id);
    return { ...prev, [tipoId]: existe ? actuales.filter(v=>v.id!==valor.id) : [...actuales,valor] };
  });

  const generarCombinaciones = () => {
    const tieneColor = coloresSeleccionados.length > 0;
    const tieneAtributos = tiposSeleccionados.some(id => (atributosSeleccionados[id]||[]).length > 0);
    if (!tieneColor && !tieneAtributos) { setError("Selecciona al menos un color o valor de atributo"); return; }

    const dimensiones = [];
    if (tieneColor) dimensiones.push(coloresSeleccionados.map(c => ({ tipo:"color", id:c.id, label:c.nombre })));
    tiposSeleccionados.forEach(tipoId => {
      const vals = atributosSeleccionados[tipoId] || [];
      if (vals.length > 0) {
        const tipo = catalogos.tiposAtributo.find(t=>t.id===tipoId);
        dimensiones.push(vals.map(v => ({ tipo:"atributo", tipoId, tipoNombre:tipo?.nombre, id:v.id, label:v.valor })));
      }
    });

    const combos = cartesiano(dimensiones);
    const nuevas = combos.map(combo => {
      const colorParte = combo.find(c=>c.tipo==="color");
      const atributoPartes = combo.filter(c=>c.tipo==="atributo");
      return {
        color_id: colorParte?.id || null,
        sku: generarSKU(combo.map(c=>c.label)),
        resumen: combo.map(c=>c.label).join(" · "),
        precio_adicional: parseFloat(precioBase) || 0,
        stock: parseInt(stockBase) || 0,
        stock_minimo: parseInt(stockMinBase) || 5,
        atributos: atributoPartes.map(a => ({ tipo_atributo_id:a.tipoId, valor_atributo_id:a.id, tipo_nombre:a.tipoNombre, valor_nombre:a.label })),
      };
    });
    setVariantesGeneradas(nuevas);
    setError("");
  };

  const actualizarVariante = (idx, campo, valor) => setVariantesGeneradas(prev => prev.map((v,i) => i===idx ? {...v,[campo]:valor} : v));
  const quitarVariante = (idx) => setVariantesGeneradas(prev => prev.filter((_,i)=>i!==idx));
  const aplicarATodos = (campo, valor) => setVariantesGeneradas(prev => prev.map(v => ({...v,[campo]:parseFloat(valor)||0})));

  const validarPaso1 = () => {
    if (!base.nombre.trim()) return "El nombre es obligatorio";
    if (!base.precio_base || isNaN(base.precio_base)) return "El precio debe ser un número válido";
    if (!base.categoria_id) return "Selecciona una categoría";
    return null;
  };

  const siguientePaso = () => {
    if (paso===1) { const err = validarPaso1(); if (err) { setError(err); return; } }
    setError(""); setPaso(p=>p+1);
  };

  const guardar = async () => {
    if (variantesGeneradas.length === 0) { setError("Genera al menos una variante"); return; }
    const skus = variantesGeneradas.map(v=>v.sku);
    const dup = skus.filter((s,i)=>skus.indexOf(s)!==i);
    if (dup.length > 0) { setError(`SKUs duplicados: ${dup.join(", ")}`); return; }
    setGuardando(true); setError("");
    try {
      const fd = new FormData();
      fd.append("producto", JSON.stringify({...base, precio_base: parseFloat(base.precio_base)}));
      fd.append("tiposAtributo", JSON.stringify(tiposSeleccionados));
      fd.append("variantes", JSON.stringify(variantesGeneradas));
      if (imagen) fd.append("imagen", imagen);
      const r = await fetch(API, { method:"POST", body:fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al guardar");
      onGuardado();
    } catch (err) { setError(err.message); }
    setGuardando(false);
  };

  const subsPorCategoria = subcategorias.filter(s => s.categoria_id == base.categoria_id);

  const totalCombinaciones = Math.max(1, coloresSeleccionados.length || 1) *
    tiposSeleccionados.reduce((acc, id) => acc * Math.max(1, (atributosSeleccionados[id]||[]).length || 1), 1);

  return (
    <>
      <div style={S.header}>
        <h1 style={S.title}>➕ Nuevo Producto</h1>
        <button style={S.btnSecondary} onClick={onCancelar}>← Volver</button>
      </div>
      <div style={S.steps}>
        {["1. Datos básicos","2. Atributos","3. Variantes"].map((s,i)=>(
          <div key={i} style={S.step(paso===i+1, paso>i+1)}>{s}</div>
        ))}
      </div>
      {error && <div style={S.error}>{error}</div>}

      {paso === 1 && (
        <div style={S.card}>
          <h3 style={{margin:"0 0 1.2rem",color:"#1e293b"}}>Información del producto</h3>
          <div style={{marginBottom:"1rem"}}>
            <label style={S.label}>Nombre *</label>
            <input style={S.input} placeholder="Ej: Playera personalizada" value={base.nombre} onChange={e=>handleBase("nombre",e.target.value)} />
          </div>
          <div style={{marginBottom:"1rem"}}>
            <label style={S.label}>Descripción</label>
            <textarea style={{...S.input,resize:"vertical",minHeight:"80px"}} placeholder="Descripción..." value={base.descripcion} onChange={e=>handleBase("descripcion",e.target.value)} />
          </div>
          <div style={{...S.grid3,marginBottom:"1rem"}}>
            <div>
              <label style={S.label}>Precio base * ($)</label>
              <input style={S.input} type="number" min="0" step="0.01" placeholder="0.00" value={base.precio_base} onChange={e=>handleBase("precio_base",e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Categoría *</label>
              <select style={S.select} value={base.categoria_id} onChange={e=>{handleBase("categoria_id",e.target.value);handleBase("subcategoria_id","");}}>
                <option value="">Seleccionar...</option>
                {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Subcategoría</label>
              <select style={S.select} value={base.subcategoria_id} onChange={e=>handleBase("subcategoria_id",e.target.value)} disabled={!base.categoria_id}>
                <option value="">Seleccionar...</option>
                {subsPorCategoria.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{...S.grid2,marginBottom:"1.5rem"}}>
            <div>
              <label style={S.label}>Marca</label>
              <select style={S.select} value={base.marca_id} onChange={e=>handleBase("marca_id",e.target.value)}>
                <option value="">Sin marca</option>
                {marcas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Material</label>
              <select style={S.select} value={base.material_id} onChange={e=>handleBase("material_id",e.target.value)}>
                <option value="">Sin material</option>
                {catalogos.materiales.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:"1.5rem"}}>
            <label style={S.label}>Imagen</label>
            <input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f){setImagen(f);setPreview(URL.createObjectURL(f));}}} style={{display:"block",marginBottom:"8px"}} />
            {preview && <img src={preview} alt="" style={{width:"100px",borderRadius:"8px",border:"1px solid #e2e8f0"}} />}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button style={S.btnPrimary} onClick={siguientePaso}>Siguiente →</button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div style={S.card}>
          <h3 style={{margin:"0 0 0.5rem",color:"#1e293b"}}>¿Qué atributos tiene este producto?</h3>
          <p style={{color:"#64748b",fontSize:"0.9rem",marginBottom:"1.5rem"}}>
            Selecciona los que aplican. En el siguiente paso elegirás los valores específicos.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"1rem",marginBottom:"2rem"}}>
            {catalogos.tiposAtributo.map(tipo=>{
              const sel = tiposSeleccionados.includes(tipo.id);
              return (
                <div key={tipo.id} onClick={()=>setTiposSeleccionados(prev=>sel?prev.filter(x=>x!==tipo.id):[...prev,tipo.id])}
                  style={{border:`2px solid ${sel?"#4f46e5":"#e2e8f0"}`,borderRadius:"12px",padding:"1.2rem",cursor:"pointer",background:sel?"#eef2ff":"#fff",transition:"all 0.15s"}}>
                  <div style={{fontWeight:700,color:sel?"#4f46e5":"#334155",marginBottom:"6px"}}>{sel?"✓ ":""}{tipo.nombre}</div>
                  <div style={{fontSize:"0.78rem",color:"#94a3b8"}}>{tipo.valores.slice(0,5).map(v=>v.valor).join(", ")}{tipo.valores.length>5?"...":""}</div>
                </div>
              );
            })}
          </div>
          {tiposSeleccionados.length===0 && (
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:"8px",padding:"12px 16px",color:"#92400e",fontSize:"0.88rem",marginBottom:"1.5rem"}}>
              ⚠️ Sin atributos seleccionados. Solo podrás elegir colores.
            </div>
          )}
          <div style={{display:"flex",gap:"1rem",justifyContent:"flex-end"}}>
            <button style={S.btnSecondary} onClick={()=>setPaso(1)}>← Anterior</button>
            <button style={S.btnPrimary} onClick={siguientePaso}>Siguiente →</button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div>
          {/* Colores */}
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.8rem"}}>
              <h3 style={{margin:0,color:"#1e293b"}}>🎨 Colores</h3>
              <div style={{display:"flex",gap:"8px"}}>
                <button style={{...S.btnSecondary,fontSize:"0.78rem",padding:"6px 12px"}} onClick={()=>setColoresSeleccionados([...catalogos.colores])}>Todos</button>
                <button style={{...S.btnSecondary,fontSize:"0.78rem",padding:"6px 12px"}} onClick={()=>setColoresSeleccionados([])}>Ninguno</button>
              </div>
            </div>
            <p style={{color:"#64748b",fontSize:"0.85rem",marginBottom:"1rem"}}>Selecciona los colores en que existe este producto.</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {catalogos.colores.map(color=>{
                const sel = !!coloresSeleccionados.find(c=>c.id===color.id);
                return <span key={color.id} style={S.chip(sel)} onClick={()=>toggleColor(color)}>{sel?"✓":"○"} {color.nombre}</span>;
              })}
            </div>
            {coloresSeleccionados.length>0 && <p style={{color:"#4f46e5",fontSize:"0.8rem",marginTop:"10px",fontWeight:600}}>{coloresSeleccionados.length} color(es) seleccionado(s)</p>}
          </div>

          {/* Atributos dinámicos */}
          {tiposSeleccionados.map(tipoId=>{
            const tipo = catalogos.tiposAtributo.find(t=>t.id===tipoId);
            if (!tipo) return null;
            const seleccionados = atributosSeleccionados[tipoId] || [];
            const iconos = {"Talla":"👕","Capacidad":"🥤","Género":"👤","Tipo de cuello":"🔵"};
            return (
              <div key={tipoId} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.8rem"}}>
                  <h3 style={{margin:0,color:"#1e293b"}}>{iconos[tipo.nombre]||"📌"} {tipo.nombre}</h3>
                  <div style={{display:"flex",gap:"8px"}}>
                    <button style={{...S.btnSecondary,fontSize:"0.78rem",padding:"6px 12px"}} onClick={()=>setAtributosSeleccionados(prev=>({...prev,[tipoId]:[...tipo.valores]}))}>Todos</button>
                    <button style={{...S.btnSecondary,fontSize:"0.78rem",padding:"6px 12px"}} onClick={()=>setAtributosSeleccionados(prev=>({...prev,[tipoId]:[]}))}>Ninguno</button>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                  {tipo.valores.map(valor=>{
                    const sel = !!seleccionados.find(v=>v.id===valor.id);
                    return <span key={valor.id} style={S.chip(sel)} onClick={()=>toggleAtributo(tipoId,valor)}>{sel?"✓":"○"} {valor.valor}</span>;
                  })}
                </div>
                {seleccionados.length>0 && <p style={{color:"#4f46e5",fontSize:"0.8rem",marginTop:"10px",fontWeight:600}}>{seleccionados.length} valor(es) seleccionado(s)</p>}
              </div>
            );
          })}

          {/* Valores por defecto */}
          <div style={S.card}>
            <h3 style={{margin:"0 0 1rem",color:"#1e293b"}}>⚙️ Valores por defecto</h3>
            <div style={S.grid3}>
              <div>
                <label style={S.label}>Precio adicional ($)</label>
                <input style={S.input} type="number" step="0.01" value={precioBase} onChange={e=>setPrecioBase(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Stock inicial</label>
                <input style={S.input} type="number" min="0" value={stockBase} onChange={e=>setStockBase(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Stock mínimo</label>
                <input style={S.input} type="number" min="0" value={stockMinBase} onChange={e=>setStockMinBase(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Botón generar */}
          <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
            <button style={{...S.btnPrimary,padding:"14px 32px",fontSize:"1rem"}} onClick={generarCombinaciones}>
              ⚡ Generar combinaciones automáticamente
            </button>
            <p style={{color:"#64748b",fontSize:"0.82rem",marginTop:"8px"}}>
              Se generarán <strong>{totalCombinaciones}</strong> variante(s)
            </p>
          </div>

          {/* Tabla editable */}
          {variantesGeneradas.length > 0 && (
            <div style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
                <h4 style={{margin:0,color:"#1e293b"}}>Variantes generadas ({variantesGeneradas.length})</h4>
                <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                  <span style={{fontSize:"0.78rem",color:"#94a3b8"}}>Aplicar a todos →</span>
                  <input type="number" placeholder="Precio adic." step="0.01" style={{...S.input,width:"110px",padding:"6px 10px",fontSize:"0.82rem"}} onBlur={e=>e.target.value!==""&&aplicarATodos("precio_adicional",e.target.value)} />
                  <input type="number" placeholder="Stock" min="0" style={{...S.input,width:"80px",padding:"6px 10px",fontSize:"0.82rem"}} onBlur={e=>e.target.value!==""&&aplicarATodos("stock",e.target.value)} />
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={S.table}>
                  <thead><tr>
                    {["Combinación","SKU (editable)","Precio final","Precio adic.","Stock","Stock mín.",""].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {variantesGeneradas.map((v,idx)=>(
                      <tr key={idx}>
                        <td style={{...S.td,fontSize:"0.82rem"}}>{v.resumen}</td>
                        <td style={S.td}>
                          <input style={{...S.input,padding:"6px 10px",fontSize:"0.82rem",fontFamily:"monospace",width:"150px"}}
                            value={v.sku} onChange={e=>actualizarVariante(idx,"sku",e.target.value.toUpperCase())} />
                        </td>
                        <td style={{...S.td,fontWeight:600}}>${(parseFloat(base.precio_base||0)+parseFloat(v.precio_adicional||0)).toFixed(2)}</td>
                        <td style={S.td}>
                          <input type="number" step="0.01" style={{...S.input,padding:"6px 10px",fontSize:"0.82rem",width:"90px"}}
                            value={v.precio_adicional} onChange={e=>actualizarVariante(idx,"precio_adicional",e.target.value)} />
                        </td>
                        <td style={S.td}>
                          <input type="number" min="0" style={{...S.input,padding:"6px 10px",fontSize:"0.82rem",width:"80px"}}
                            value={v.stock} onChange={e=>actualizarVariante(idx,"stock",e.target.value)} />
                        </td>
                        <td style={S.td}>
                          <input type="number" min="0" style={{...S.input,padding:"6px 10px",fontSize:"0.82rem",width:"80px"}}
                            value={v.stock_minimo} onChange={e=>actualizarVariante(idx,"stock_minimo",e.target.value)} />
                        </td>
                        <td style={S.td}><button style={S.btnDanger} onClick={()=>quitarVariante(idx)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:"1rem",justifyContent:"flex-end",marginTop:"1rem"}}>
            <button style={S.btnSecondary} onClick={()=>setPaso(2)}>← Anterior</button>
            <button style={{...S.btnPrimary,opacity:guardando?0.6:1}} onClick={guardar} disabled={guardando}>
              {guardando?"Guardando...":"✓ Guardar producto"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DetalleProducto({ producto, catalogos, onActualizar, onVolver }) {
  const [error, setError] = useState("");
  const [stockEdit, setStockEdit] = useState({});

  const badge = (color, text) => (
    <span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"0.75rem",fontWeight:600,
      background:color==="green"?"#dcfce7":color==="red"?"#fee2e2":color==="yellow"?"#fef9c3":"#f1f5f9",
      color:color==="green"?"#16a34a":color==="red"?"#dc2626":color==="yellow"?"#92400e":"#475569"}}>{text}</span>
  );

  const actualizarStock = async (varianteId, cantidad) => {
    const r = await fetch(`${API}/${producto.id}/variantes/${varianteId}/stock`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({cantidad:parseInt(cantidad)})
    });
    if (r.ok) { onActualizar(); setStockEdit({}); } else setError("Error al actualizar stock");
  };

  const eliminarVariante = async (varianteId) => {
    if (!confirm("¿Eliminar esta variante?")) return;
    await fetch(`${API}/${producto.id}/variantes/${varianteId}`, {method:"DELETE"});
    onActualizar();
  };

  return (
    <>
      <div style={S.header}>
        <h1 style={S.title}>📦 {producto.nombre}</h1>
        <button style={S.btnSecondary} onClick={onVolver}>← Volver</button>
      </div>
      {error && <div style={S.error}>{error}</div>}

      <div style={{...S.card,display:"grid",gridTemplateColumns:"auto 1fr",gap:"1.5rem",alignItems:"start"}}>
        {producto.imagen_url
          ? <img src={`http://localhost:5000${producto.imagen_url}`} alt={producto.nombre} style={{width:"130px",height:"130px",objectFit:"cover",borderRadius:"12px",border:"1px solid #e2e8f0"}} />
          : <div style={{width:"130px",height:"130px",background:"#f1f5f9",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8",fontSize:"2.5rem"}}>📷</div>
        }
        <div>
          <div style={{fontSize:"1.2rem",fontWeight:700,color:"#1e293b",marginBottom:"6px"}}>{producto.nombre}</div>
          <div style={{color:"#64748b",fontSize:"0.9rem",marginBottom:"12px"}}>{producto.descripcion||"Sin descripción"}</div>
          <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap"}}>
            <div><span style={{color:"#94a3b8",fontSize:"0.8rem"}}>Precio base</span><br/><strong>${parseFloat(producto.precio_base).toFixed(2)}</strong></div>
            <div><span style={{color:"#94a3b8",fontSize:"0.8rem"}}>Categoría</span><br/><strong>{producto.categoria_nombre}</strong></div>
            <div><span style={{color:"#94a3b8",fontSize:"0.8rem"}}>Marca</span><br/><strong>{producto.marca_nombre||"—"}</strong></div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{margin:"0 0 1rem",color:"#1e293b"}}>Variantes ({producto.variantes?.length||0})</h3>
        {!producto.variantes?.length
          ? <p style={{color:"#94a3b8",textAlign:"center",padding:"1rem"}}>Sin variantes</p>
          : <table style={S.table}>
              <thead><tr>{["SKU","Color","Atributos","Precio final","Stock","Estado","Acciones"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {producto.variantes.map(v=>{
                  const precioFinal = parseFloat(producto.precio_base)+parseFloat(v.precio_adicional||0);
                  const st=v.stock||0, stMin=v.stock_minimo||5;
                  return (
                    <tr key={v.id}>
                      <td style={{...S.td,fontFamily:"monospace",fontSize:"0.82rem"}}>{v.sku}</td>
                      <td style={S.td}>{v.color_nombre||"—"}</td>
                      <td style={S.td}>{v.atributos?.map(a=>(
                        <span key={a.tipo_atributo_id} style={{display:"inline-block",padding:"2px 8px",borderRadius:"12px",background:"#f1f5f9",color:"#475569",fontSize:"0.75rem",fontWeight:600,marginRight:"4px"}}>
                          {a.tipo_nombre}: {a.valor_nombre}
                        </span>
                      ))}</td>
                      <td style={S.td}>${precioFinal.toFixed(2)}</td>
                      <td style={S.td}>
                        {stockEdit[v.id]!==undefined
                          ? <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                              <input type="number" min="0" style={{...S.input,width:"70px",padding:"5px 8px"}}
                                value={stockEdit[v.id]} onChange={e=>setStockEdit(s=>({...s,[v.id]:e.target.value}))} />
                              <button style={S.btnSuccess} onClick={()=>actualizarStock(v.id,stockEdit[v.id])}>✓</button>
                              <button style={S.btnDanger} onClick={()=>setStockEdit(s=>{const n={...s};delete n[v.id];return n;})}>✕</button>
                            </div>
                          : <span onClick={()=>setStockEdit(s=>({...s,[v.id]:st}))} style={{cursor:"pointer",fontWeight:600,textDecoration:"underline dotted"}} title="Click para editar">{st} uds</span>
                        }
                      </td>
                      <td style={S.td}>{badge(st===0?"red":st<=stMin?"yellow":"green", st===0?"Sin stock":st<=stMin?"Stock bajo":"OK")}</td>
                      <td style={S.td}><button style={S.btnDanger} onClick={()=>eliminarVariante(v.id)}>Eliminar</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </>
  );
}