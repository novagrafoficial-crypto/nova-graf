import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import "../../styles/admin/AdminProductos.css";
import ModalConfirm from "../../components/ModalConfirm";

const API = `${import.meta.env.VITE_API_URL}/api/admin/productos`;
const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin`;
const API_PROV = `${import.meta.env.VITE_API_URL}/api/admin`;
const BUCKET = "Productos";

const C = {
  teal2: "#35BA99",
  teal1: "#1A6163",
  gris: "#DBDBDB",
  rojo: "#FF0000",
  blanco: "#FFFFFF",
  fondo: "#F4F7F7",
  fondoCard: "#FFFFFF",
  texto: "#111111",
  textoSub: "#4A5568",
  textoMuted: "#9AA5B4",
  bordeLinea: "#E8ECEF",
};

// ─── HELPER: subir imagen ─────────────────────────────────
const subirImagen = async (file, carpeta = "variantes") => {
  const ext = file.name.split(".").pop();
  const nombre = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(nombre, file, { cacheControl: "3600", upsert: false });
  if (error) throw new Error(`Error al subir imagen: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
  return data.publicUrl;
};

// ─── ESTILOS ──────────────────────────────────────────────
const S = {
  page: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: C.fondo, minHeight: "100vh", padding: "2rem 2.5rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
  title: { fontSize: "1.7rem", fontWeight: 700, color: C.teal1, margin: 0, letterSpacing: "-0.5px" },
  btnPrimary: { background: C.teal1, color: C.blanco, border: "none", padding: "10px 22px", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  btnSecondary: { background: C.blanco, color: C.teal1, border: `1.5px solid ${C.teal1}`, padding: "9px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" },
  btnDanger: { background: "#FFF0F0", color: C.rojo, border: "1px solid #FFCCCC", padding: "6px 13px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" },
  btnSuccess: { background: "#E6F9F5", color: C.teal1, border: `1px solid ${C.teal2}`, padding: "6px 13px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" },
  btnWarning: { background: "#FFF8E6", color: "#8A6000", border: "1px solid #F5D87A", padding: "6px 13px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" },
  card: { background: C.fondoCard, borderRadius: "16px", padding: "1.6rem", border: `1px solid ${C.bordeLinea}`, boxShadow: "0 2px 8px rgba(26,97,99,0.06)", marginBottom: "1.5rem" },
  cardTitle: { fontSize: "1rem", fontWeight: 700, color: C.teal1, margin: "0 0 1.2rem 0" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: 700, color: C.textoSub, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.gris}`, borderRadius: "10px", fontSize: "0.9rem", boxSizing: "border-box", outline: "none", color: C.texto, background: C.blanco },
  select: { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.gris}`, borderRadius: "10px", fontSize: "0.9rem", boxSizing: "border-box", color: C.texto, background: C.blanco, outline: "none" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
  error: { background: "#FFF0F0", color: C.rojo, border: "1px solid #FFCCCC", padding: "12px 16px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "1rem", fontWeight: 500 },
  success: { background: "#E6F9F5", color: C.teal1, border: `1px solid ${C.teal2}`, padding: "12px 16px", borderRadius: "10px", fontSize: "0.88rem", marginBottom: "1rem", fontWeight: 500 },
  steps: { display: "flex", marginBottom: "2rem", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.bordeLinea}` },
  step: (active, done) => ({ flex: 1, padding: "14px", textAlign: "center", fontSize: "0.84rem", fontWeight: 700, background: done ? C.teal1 : active ? "#E6F4F4" : C.blanco, color: done ? C.blanco : active ? C.teal1 : C.textoMuted, borderBottom: `3px solid ${done || active ? C.teal2 : C.gris}` }),
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.87rem" },
  th: { padding: "11px 14px", textAlign: "left", background: "#F0F8F7", color: C.teal1, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `2px solid ${C.teal2}` },
  td: { padding: "11px 14px", borderBottom: `1px solid ${C.bordeLinea}`, color: C.texto, verticalAlign: "middle" },
  chip: (sel) => ({ display: "inline-flex", alignItems: "center", gap: "5px", padding: "7px 15px", borderRadius: "20px", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, userSelect: "none", border: sel ? `2px solid ${C.teal1}` : `2px solid ${C.gris}`, background: sel ? "#E6F4F4" : C.blanco, color: sel ? C.teal1 : C.textoSub }),
};

// ─── Helpers ──────────────────────────────────────────────
function cartesiano(arrays) {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  return first.flatMap(item => cartesiano(rest).map(combo => [item, ...combo]));
}

function generarSKU(partes) {
  const base = partes.map(p => p.toString().toUpperCase().replace(/\s+/g, "").substring(0, 4)).join("-");
  return `${base}-${Date.now()}`;
}

function badge(color, text) {
  const map = {
    green: { bg: "#E6F9F5", color: C.teal1, border: `1px solid ${C.teal2}` },
    red: { bg: "#FFF0F0", color: C.rojo, border: "1px solid #FFCCCC" },
    yellow: { bg: "#FFF8E6", color: "#8A6000", border: "1px solid #F5D87A" },
  };
  const e = map[color] || { bg: C.fondo, color: C.textoSub, border: `1px solid ${C.gris}` };
  return <span style={{ display: "inline-block", padding: "3px 11px", borderRadius: "20px", fontSize: "0.74rem", fontWeight: 700, background: e.bg, color: e.color, border: e.border }}>{text}</span>;
}

// ─── ROOT ─────────────────────────────────────────────────
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
  const [modalOpen, setModalOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

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

  const abrirEdicion = async (id) => {
    const r = await fetch(`${API}/${id}`);
    const d = await r.json();
    setProductoActivo(d);
    setVista("editar");
  };

  const handleEliminarClick = (producto) => {
    setProductoAEliminar(producto);
    setModalOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      const r = await fetch(`${API}/${productoAEliminar.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) { alert(d.error || "Error al eliminar"); return; }
      await cargar();
      alert("✅ Producto desactivado correctamente");
    } catch (err) {
      alert("Error al eliminar");
    } finally {
      setModalOpen(false);
      setProductoAEliminar(null);
    }
  };

  return (
    <div style={S.page}>
      <ModalConfirm
        isOpen={modalOpen}
        title="Eliminar producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${productoAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmarEliminar}
        onCancel={() => {
          setModalOpen(false);
          setProductoAEliminar(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {vista === "lista" && (
        <ListaProductos
          productos={productos} loading={loading} error={error}
          onCrear={() => setVista("crear")}
          onDetalle={verDetalle}
          onEditar={abrirEdicion}
          onEliminar={handleEliminarClick}
        />
      )}
      {vista === "crear" && (
        <WizardCrear
          catalogos={catalogos} categorias={categorias}
          subcategorias={subcategorias} marcas={marcas}
          onGuardado={() => { cargar(); setVista("lista"); }}
          onCancelar={() => setVista("lista")}
        />
      )}
      {vista === "editar" && productoActivo && (
        <EditarProducto
          producto={productoActivo}
          categorias={categorias} subcategorias={subcategorias}
          marcas={marcas} catalogos={catalogos}
          onGuardado={() => { cargar(); setVista("lista"); }}
          onCancelar={() => setVista("lista")}
        />
      )}
      {vista === "detalle" && productoActivo && (
        <DetalleProducto
          producto={productoActivo} catalogos={catalogos}
          onVolver={() => { setVista("lista"); setProductoActivo(null); }}
        />
      )}
    </div>
  );
}

// ─── LISTA ────────────────────────────────────────────────
function ListaProductos({ productos, loading, error, onCrear, onDetalle, onEditar, onEliminar }) {
  return (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Productos</h1>
          <p style={{ margin: "2px 0 0", color: C.textoMuted, fontSize: "0.85rem" }}>Gestión de catálogo</p>
        </div>
        <button style={S.btnPrimary} onClick={onCrear}>+ Nuevo producto</button>
      </div>
      {error && <div style={S.error}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: C.textoMuted }}>Cargando...</div>
      ) : (
        <div style={S.card}>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>{["ID","Nombre","Categoría","Marca","Precio base","Variantes","Stock","Estado","Acciones"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {productos.length === 0
                  ? <tr><td colSpan={9} style={{ ...S.td, textAlign: "center", color: C.textoMuted, padding: "3rem" }}>No hay productos aún</td></tr>
                  : productos.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? C.blanco : "#FAFCFC" }}>
                      <td style={{ ...S.td, color: C.textoMuted, fontWeight: 600, fontSize: "0.8rem" }}>#{p.id}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {p.imagen_url
                            ? <img src={p.imagen_url} alt="" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "8px" }} />
                            : <div style={{ width: "36px", height: "36px", background: "#E6F4F4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>📷</div>
                          }
                          {p.nombre}
                        </div>
                      </td>
                      <td style={S.td}>{p.categoria_nombre}</td>
                      <td style={S.td}>{p.marca_nombre || "—"}</td>
                      <td style={{ ...S.td, fontWeight: 700, color: C.teal1 }}>${parseFloat(p.precio_base).toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        <span style={{ background: "#E6F4F4", color: C.teal1, borderRadius: "20px", padding: "3px 12px", fontWeight: 700, fontSize: "0.8rem" }}>{p.num_variantes}</span>
                      </td>
                      <td style={S.td}>{badge(p.stock_total > 0 ? "green" : "red", `${p.stock_total} unidades`)}</td>
                      <td style={S.td}>{badge(p.activo ? "green" : "red", p.activo ? "Activo" : "Inactivo")}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={S.btnPrimary} onClick={() => onDetalle(p.id)}>Ver</button>
                          <button style={S.btnWarning} onClick={() => onEditar(p.id)}>Editar</button>
                          <button style={S.btnDanger} onClick={() => onEliminar(p)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ─── EDITAR PRODUCTO ──────────────────────────────────────
function EditarProducto({ producto, categorias, subcategorias, marcas, catalogos, onGuardado, onCancelar }) {
  const [form, setForm] = useState({
    nombre: producto.nombre || "",
    descripcion: producto.descripcion || "",
    precio_base: producto.precio_base || "",
    categoria_id: producto.categoria_id || "",
    subcategoria_id: producto.subcategoria_id || "",
    marca_id: producto.marca_id || "",
    material_id: producto.material_id || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio");
    if (!form.precio_base || isNaN(form.precio_base)) return setError("El precio debe ser un número válido");
    if (!form.categoria_id) return setError("Selecciona una categoría");
    setGuardando(true);
    setError("");
    setExito("");
    try {
      const r = await fetch(`${API}/${producto.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precio_base: parseFloat(form.precio_base),
          categoria_id: parseInt(form.categoria_id),
          subcategoria_id: form.subcategoria_id ? parseInt(form.subcategoria_id) : null,
          marca_id: form.marca_id ? parseInt(form.marca_id) : null,
          material_id: form.material_id ? parseInt(form.material_id) : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al guardar");
      setExito("Producto actualizado correctamente");
      setTimeout(() => onGuardado(), 800);
    } catch (err) {
      setError(err.message);
    }
    setGuardando(false);
  };

  const subsPorCategoria = subcategorias.filter(s => s.categoria_id == form.categoria_id);

  return (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Editar producto</h1>
          <p style={{ margin: "2px 0 0", color: C.textoMuted, fontSize: "0.85rem" }}>#{producto.id} · {producto.nombre}</p>
        </div>
        <button style={S.btnSecondary} onClick={onCancelar}>← Volver</button>
      </div>
      {error && <div style={S.error}>{error}</div>}
      {exito && <div style={S.success}>{exito}</div>}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Datos del producto</h3>
        <div style={{ marginBottom: "1rem" }}>
          <label style={S.label}>Nombre *</label>
          <input style={S.input} value={form.nombre} onChange={e => handle("nombre", e.target.value)} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={S.label}>Descripción</label>
          <textarea style={{ ...S.input, resize: "vertical", minHeight: "80px" }} value={form.descripcion} onChange={e => handle("descripcion", e.target.value)} />
        </div>
        <div style={{ ...S.grid3, marginBottom: "1rem" }}>
          <div>
            <label style={S.label}>Precio base * ($)</label>
            <input style={S.input} type="number" min="0" step="0.01" value={form.precio_base} onChange={e => handle("precio_base", e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Categoría *</label>
            <select style={S.select} value={form.categoria_id} onChange={e => { handle("categoria_id", e.target.value); handle("subcategoria_id", ""); }}>
              <option value="">Seleccionar...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Subcategoría</label>
            <select style={S.select} value={form.subcategoria_id} onChange={e => handle("subcategoria_id", e.target.value)} disabled={!form.categoria_id}>
              <option value="">Seleccionar...</option>
              {subsPorCategoria.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>
        <div style={{ ...S.grid2, marginBottom: "1.5rem" }}>
          <div>
            <label style={S.label}>Marca</label>
            <select style={S.select} value={form.marca_id} onChange={e => handle("marca_id", e.target.value)}>
              <option value="">Sin marca</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Material</label>
            <select style={S.select} value={form.material_id} onChange={e => handle("material_id", e.target.value)}>
              <option value="">Sin material</option>
              {catalogos.materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button style={S.btnSecondary} onClick={onCancelar}>Cancelar</button>
          <button style={{ ...S.btnPrimary, opacity: guardando ? 0.6 : 1 }} onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "✓ Guardar cambios"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── WIZARD CREAR (se mantiene igual, solo se ajustó el mensaje de proveedores)
// Nota: Por razones de espacio, el WizardCrear se mantiene como estaba,
// solo se agregó un mensaje informativo sobre proveedores.

function WizardCrear({ catalogos, categorias, subcategorias, marcas, onGuardado, onCancelar }) {
  const [paso, setPaso] = useState(1);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState("");
  const [base, setBase] = useState({ nombre: "", descripcion: "", precio_base: "", categoria_id: "", subcategoria_id: "", marca_id: "", material_id: "" });
  const [tiposSeleccionados, setTiposSeleccionados] = useState([]);
  const [coloresSeleccionados, setColoresSeleccionados] = useState([]);
  const [atributosSeleccionados, setAtributosSeleccionados] = useState({});
  const [variantesGeneradas, setVariantesGeneradas] = useState([]);
  const [imagenes, setImagenes] = useState({});
  const [precioBase, setPrecioBase] = useState(0);
  const [stockBase, setStockBase] = useState(0);
  const [stockMinBase, setStockMinBase] = useState(5);

  const handleBase = (k, v) => setBase(b => ({ ...b, [k]: v }));
  const toggleColor = (color) => setColoresSeleccionados(prev => prev.find(c => c.id === color.id) ? prev.filter(c => c.id !== color.id) : [...prev, color]);
  const toggleAtributo = (tipoId, valor) => setAtributosSeleccionados(prev => {
    const actuales = prev[tipoId] || [];
    const existe = actuales.find(v => v.id === valor.id);
    return { ...prev, [tipoId]: existe ? actuales.filter(v => v.id !== valor.id) : [...actuales, valor] };
  });

  const seleccionarImagen = (idx, file) => {
    if (!file) return;
    setImagenes(prev => ({ ...prev, [idx]: { file, preview: URL.createObjectURL(file) } }));
  };

  const quitarImagen = (idx) => {
    setImagenes(prev => {
      const next = { ...prev };
      if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview);
      delete next[idx];
      return next;
    });
  };

  const generarCombinaciones = () => {
    const tieneColor = coloresSeleccionados.length > 0;
    const tieneAtributos = tiposSeleccionados.some(id => (atributosSeleccionados[id] || []).length > 0);
    if (!tieneColor && !tieneAtributos) { setError("Selecciona al menos un color o valor de atributo"); return; }
    const dimensiones = [];
    if (tieneColor) dimensiones.push(coloresSeleccionados.map(c => ({ tipo: "color", id: c.id, label: c.nombre })));
    tiposSeleccionados.forEach(tipoId => {
      const vals = atributosSeleccionados[tipoId] || [];
      if (vals.length > 0) {
        const tipo = catalogos.tiposAtributo.find(t => t.id === tipoId);
        dimensiones.push(vals.map(v => ({ tipo: "atributo", tipoId, tipoNombre: tipo?.nombre, id: v.id, label: v.valor })));
      }
    });
    const combos = cartesiano(dimensiones);
    setVariantesGeneradas(combos.map(combo => ({
      color_id: combo.find(c => c.tipo === "color")?.id || null,
      sku: generarSKU(combo.map(c => c.label)),
      resumen: combo.map(c => c.label).join(" · "),
      precio_adicional: parseFloat(precioBase) || 0,
      stock: parseInt(stockBase) || 0,
      stock_minimo: parseInt(stockMinBase) || 5,
      atributos: combo.filter(c => c.tipo === "atributo").map(a => ({ tipo_atributo_id: a.tipoId, valor_atributo_id: a.id, tipo_nombre: a.tipoNombre, valor_nombre: a.label })),
    })));
    setImagenes({});
    setError("");
  };

  const actualizarVariante = (idx, campo, valor) => setVariantesGeneradas(prev => prev.map((v, i) => i === idx ? { ...v, [campo]: valor } : v));
  const quitarVariante = (idx) => { quitarImagen(idx); setVariantesGeneradas(prev => prev.filter((_, i) => i !== idx)); };
  const aplicarATodos = (campo, valor) => setVariantesGeneradas(prev => prev.map(v => ({ ...v, [campo]: parseFloat(valor) || 0 })));

  const validarPaso1 = () => {
    if (!base.nombre.trim()) return "El nombre es obligatorio";
    if (!base.precio_base || isNaN(base.precio_base)) return "El precio debe ser un número válido";
    if (!base.categoria_id) return "Selecciona una categoría";
    return null;
  };

  const siguientePaso = () => {
    if (paso === 1) { const err = validarPaso1(); if (err) { setError(err); return; } }
    setError("");
    setPaso(p => p + 1);
  };

  const guardar = async () => {
    if (variantesGeneradas.length === 0) { setError("Genera al menos una variante"); return; }
    const skus = variantesGeneradas.map(v => v.sku);
    const dup = skus.filter((s, i) => skus.indexOf(s) !== i);
    if (dup.length > 0) { setError(`SKUs duplicados: ${dup.join(", ")}`); return; }
    setGuardando(true);
    setError("");
    try {
      const variantesConUrl = await Promise.all(
        variantesGeneradas.map(async (v, idx) => {
          const imgData = imagenes[idx];
          if (!imgData?.file) return { ...v, imagen_url: null };
          setProgresoSubida(`Subiendo imagen ${idx + 1} de ${variantesGeneradas.length}...`);
          const url = await subirImagen(imgData.file);
          return { ...v, imagen_url: url };
        })
      );
      setProgresoSubida("Guardando producto...");
      const fd = new FormData();
      fd.append("producto", JSON.stringify({ ...base, precio_base: parseFloat(base.precio_base) }));
      fd.append("tiposAtributo", JSON.stringify(tiposSeleccionados));
      fd.append("variantes", JSON.stringify(variantesConUrl));
      const r = await fetch(API, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al guardar");
      setProgresoSubida("");
      onGuardado();
    } catch (err) {
      setError(err.message);
      setProgresoSubida("");
    }
    setGuardando(false);
  };

  const subsPorCategoria = subcategorias.filter(s => s.categoria_id == base.categoria_id);
  const totalCombinaciones = Math.max(1, coloresSeleccionados.length || 1) *
    tiposSeleccionados.reduce((acc, id) => acc * Math.max(1, (atributosSeleccionados[id] || []).length || 1), 1);

  return (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Nuevo Producto</h1>
          <p style={{ margin: "2px 0 0", color: C.textoMuted, fontSize: "0.85rem" }}>Asistente de creación</p>
        </div>
        <button style={S.btnSecondary} onClick={onCancelar}>← Volver</button>
      </div>
      <div style={S.steps}>
        {["1. Datos básicos", "2. Atributos", "3. Variantes"].map((s, i) => (
          <div key={i} style={S.step(paso === i + 1, paso > i + 1)}>{s}</div>
        ))}
      </div>
      {error && <div style={S.error}>{error}</div>}

      {paso === 1 && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Información del producto</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Nombre *</label>
            <input style={S.input} placeholder="Ej: Playera personalizada" value={base.nombre} onChange={e => handleBase("nombre", e.target.value)} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={S.label}>Descripción</label>
            <textarea style={{ ...S.input, resize: "vertical", minHeight: "80px" }} placeholder="Descripción..." value={base.descripcion} onChange={e => handleBase("descripcion", e.target.value)} />
          </div>
          <div style={{ ...S.grid3, marginBottom: "1rem" }}>
            <div>
              <label style={S.label}>Precio base * ($)</label>
              <input style={S.input} type="number" min="0" step="0.01" placeholder="0.00" value={base.precio_base} onChange={e => handleBase("precio_base", e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Categoría *</label>
              <select style={S.select} value={base.categoria_id} onChange={e => { handleBase("categoria_id", e.target.value); handleBase("subcategoria_id", ""); }}>
                <option value="">Seleccionar...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Subcategoría</label>
              <select style={S.select} value={base.subcategoria_id} onChange={e => handleBase("subcategoria_id", e.target.value)} disabled={!base.categoria_id}>
                <option value="">Seleccionar...</option>
                {subsPorCategoria.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ ...S.grid2, marginBottom: "1.5rem" }}>
            <div>
              <label style={S.label}>Marca</label>
              <select style={S.select} value={base.marca_id} onChange={e => handleBase("marca_id", e.target.value)}>
                <option value="">Sin marca</option>
                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Material</label>
              <select style={S.select} value={base.material_id} onChange={e => handleBase("material_id", e.target.value)}>
                <option value="">Sin material</option>
                {catalogos.materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={S.btnPrimary} onClick={siguientePaso}>Siguiente →</button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>¿Qué atributos tiene este producto?</h3>
          <p style={{ color: C.textoMuted, fontSize: "0.88rem", marginBottom: "1.5rem", marginTop: "-0.5rem" }}>Selecciona los que aplican.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {catalogos.tiposAtributo.map(tipo => {
              const sel = tiposSeleccionados.includes(tipo.id);
              return (
                <div key={tipo.id}
                  onClick={() => setTiposSeleccionados(prev => sel ? prev.filter(x => x !== tipo.id) : [...prev, tipo.id])}
                  style={{ border: `2px solid ${sel ? C.teal1 : C.gris}`, borderRadius: "12px", padding: "1.2rem", cursor: "pointer", background: sel ? "#E6F4F4" : C.blanco }}>
                  <div style={{ fontWeight: 700, color: sel ? C.teal1 : C.texto, marginBottom: "6px" }}>{sel ? "✓ " : ""}{tipo.nombre}</div>
                  <div style={{ fontSize: "0.78rem", color: C.textoMuted }}>{tipo.valores.slice(0, 5).map(v => v.valor).join(", ")}{tipo.valores.length > 5 ? "..." : ""}</div>
                </div>
              );
            })}
          </div>
          {tiposSeleccionados.length === 0 && (
            <div style={{ background: "#FFF8E6", border: "1px solid #F5D87A", borderRadius: "10px", padding: "12px 16px", color: "#8A6000", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
              ⚠️ Sin atributos seleccionados. Solo podrás elegir colores.
            </div>
          )}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button style={S.btnSecondary} onClick={() => setPaso(1)}>← Anterior</button>
            <button style={S.btnPrimary} onClick={siguientePaso}>Siguiente →</button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <h3 style={S.cardTitle}>🎨 Colores</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={{ ...S.btnSecondary, fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => setColoresSeleccionados([...catalogos.colores])}>Todos</button>
                <button style={{ ...S.btnSecondary, fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => setColoresSeleccionados([])}>Ninguno</button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {catalogos.colores.map(color => {
                const sel = !!coloresSeleccionados.find(c => c.id === color.id);
                return <span key={color.id} style={S.chip(sel)} onClick={() => toggleColor(color)}>{sel ? "✓" : "○"} {color.nombre}</span>;
              })}
            </div>
            {coloresSeleccionados.length > 0 && <p style={{ color: C.teal1, fontSize: "0.8rem", marginTop: "10px", fontWeight: 700 }}>{coloresSeleccionados.length} color(es)</p>}
          </div>

          {tiposSeleccionados.map(tipoId => {
            const tipo = catalogos.tiposAtributo.find(t => t.id === tipoId);
            if (!tipo) return null;
            const seleccionados = atributosSeleccionados[tipoId] || [];
            return (
              <div key={tipoId} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                  <h3 style={S.cardTitle}>📌 {tipo.nombre}</h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{ ...S.btnSecondary, fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => setAtributosSeleccionados(prev => ({ ...prev, [tipoId]: [...tipo.valores] }))}>Todos</button>
                    <button style={{ ...S.btnSecondary, fontSize: "0.78rem", padding: "6px 12px" }} onClick={() => setAtributosSeleccionados(prev => ({ ...prev, [tipoId]: [] }))}>Ninguno</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {tipo.valores.map(valor => {
                    const sel = !!seleccionados.find(v => v.id === valor.id);
                    return <span key={valor.id} style={S.chip(sel)} onClick={() => toggleAtributo(tipoId, valor)}>{sel ? "✓" : "○"} {valor.valor}</span>;
                  })}
                </div>
              </div>
            );
          })}

          <div style={S.card}>
            <h3 style={S.cardTitle}>⚙️ Valores por defecto para las variantes</h3>
            <div style={S.grid3}>
              <div><label style={S.label}>Precio adicional ($)</label><input style={S.input} type="number" step="0.01" value={precioBase} onChange={e => setPrecioBase(e.target.value)} /></div>
              <div><label style={S.label}>Stock inicial</label><input style={S.input} type="number" min="0" value={stockBase} onChange={e => setStockBase(e.target.value)} /></div>
              <div><label style={S.label}>Stock mínimo</label><input style={S.input} type="number" min="0" value={stockMinBase} onChange={e => setStockMinBase(e.target.value)} /></div>
            </div>
            <p style={{ margin: "1rem 0 0", fontSize: "0.8rem", color: C.textoMuted }}>
              💡 Podrás asignar proveedores al producto una vez que lo guardes.
            </p>
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <button style={{ ...S.btnPrimary, padding: "14px 36px", fontSize: "1rem", background: C.teal2 }} onClick={generarCombinaciones}>
              ⚡ Generar combinaciones automáticamente
            </button>
            <p style={{ color: C.textoMuted, fontSize: "0.82rem", marginTop: "8px" }}>
              Se generarán <strong style={{ color: C.teal1 }}>{totalCombinaciones}</strong> variante(s)
            </p>
          </div>

          {variantesGeneradas.length > 0 && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ ...S.cardTitle, margin: 0 }}>Variantes generadas ({variantesGeneradas.length})</h4>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: C.textoMuted }}>Aplicar a todos →</span>
                  <input type="number" placeholder="Precio adic." step="0.01" style={{ ...S.input, width: "110px", padding: "6px 10px", fontSize: "0.82rem" }} onBlur={e => e.target.value !== "" && aplicarATodos("precio_adicional", e.target.value)} />
                  <input type="number" placeholder="Stock" min="0" style={{ ...S.input, width: "80px", padding: "6px 10px", fontSize: "0.82rem" }} onBlur={e => e.target.value !== "" && aplicarATodos("stock", e.target.value)} />
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead>
                    <tr>{["Imagen","Combinación","SKU","Precio final","Precio adic.","Stock","Stock mín.",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {variantesGeneradas.map((v, idx) => {
                      const img = imagenes[idx];
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? C.blanco : "#FAFCFC" }}>
                          <td style={{ ...S.td, width: "80px" }}>
                            {img?.preview
                              ? (
                                <div style={{ position: "relative", display: "inline-block" }}>
                                  <img src={img.preview} alt="" style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "8px", display: "block" }} />
                                  <button onClick={() => quitarImagen(idx)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: C.rojo, color: C.blanco, border: "none", cursor: "pointer", fontSize: "10px", lineHeight: "18px", textAlign: "center", padding: 0 }}>✕</button>
                                </div>
                              ) : (
                                <label style={{ cursor: "pointer" }}>
                                  <div style={{ width: "52px", height: "52px", background: "#E6F4F4", border: `1.5px dashed ${C.teal2}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal1, fontSize: "1.2rem" }}>+</div>
                                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => seleccionarImagen(idx, e.target.files[0])} />
                                </label>
                              )
                            }
                          </td>
                          <td style={{ ...S.td, fontSize: "0.82rem", fontWeight: 600 }}>{v.resumen}</td>
                          <td style={S.td}><input style={{ ...S.input, padding: "6px 10px", fontSize: "0.82rem", fontFamily: "monospace", width: "150px" }} value={v.sku} onChange={e => actualizarVariante(idx, "sku", e.target.value.toUpperCase())} /></td>
                          <td style={{ ...S.td, fontWeight: 700, color: C.teal1 }}>${(parseFloat(base.precio_base || 0) + parseFloat(v.precio_adicional || 0)).toFixed(2)}</td>
                          <td style={S.td}><input type="number" step="0.01" style={{ ...S.input, padding: "6px 10px", fontSize: "0.82rem", width: "90px" }} value={v.precio_adicional} onChange={e => actualizarVariante(idx, "precio_adicional", e.target.value)} /></td>
                          <td style={S.td}><input type="number" min="0" style={{ ...S.input, padding: "6px 10px", fontSize: "0.82rem", width: "80px" }} value={v.stock} onChange={e => actualizarVariante(idx, "stock", e.target.value)} /></td>
                          <td style={S.td}><input type="number" min="0" style={{ ...S.input, padding: "6px 10px", fontSize: "0.82rem", width: "80px" }} value={v.stock_minimo} onChange={e => actualizarVariante(idx, "stock_minimo", e.target.value)} /></td>
                          <td style={S.td}><button style={S.btnDanger} onClick={() => quitarVariante(idx)}>✕</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {progresoSubida && <div style={{ ...S.success, textAlign: "center" }}>⏳ {progresoSubida}</div>}

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button style={S.btnSecondary} onClick={() => setPaso(2)}>← Anterior</button>
            <button style={{ ...S.btnPrimary, opacity: guardando ? 0.6 : 1 }} onClick={guardar} disabled={guardando}>
              {guardando ? "Guardando..." : "✓ Guardar producto"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── DETALLE ──────────────────────────────────────────────
function DetalleProducto({ producto: productoInicial, catalogos, onVolver }) {
  const [producto, setProducto] = useState(productoInicial);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [stockEdit, setStockEdit] = useState({});
  const [varEditId, setVarEditId] = useState(null);
  const [varEditForm, setVarEditForm] = useState({});
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);

  // Proveedores
  const [proveedores, setProveedores] = useState([]);
  const [todosProveedores, setTodosProveedores] = useState([]);
  const [provForm, setProvForm] = useState({ proveedor_id: "", precio_costo: "" });
  const [provEditId, setProvEditId] = useState(null);
  const [provEditPrecio, setProvEditPrecio] = useState("");
  const [guardandoProv, setGuardandoProv] = useState(false);
  const [mostrarFormProv, setMostrarFormProv] = useState(false);

  const recargar = async () => {
    try {
      const r = await fetch(`${API}/${productoInicial.id}`);
      const d = await r.json();
      setProducto(d);
    } catch {
      setError("Error al recargar");
    }
  };

  const cargarProveedores = async () => {
    try {
      const [rAsig, rTodos] = await Promise.all([
        fetch(`${API_PROV}/productos/${productoInicial.id}/proveedores`).then(r => r.json()),
        fetch(`${API_PROV}/proveedores`).then(r => r.json()),
      ]);
      setProveedores(Array.isArray(rAsig) ? rAsig : []);
      setTodosProveedores(Array.isArray(rTodos) ? rTodos : []);
    } catch {
      setError("Error al cargar proveedores");
    }
  };

  useEffect(() => { cargarProveedores(); }, []);

  const mostrarExito = (msg) => { setExito(msg); setTimeout(() => setExito(""), 3000); };
  const mostrarError = (msg) => { setError(msg); setTimeout(() => setError(""), 4000); };

  const agregarProveedor = async () => {
    if (!provForm.proveedor_id) { mostrarError("Selecciona un proveedor"); return; }
    setGuardandoProv(true);
    try {
      const r = await fetch(`${API_PROV}/productos/${productoInicial.id}/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedor_id: parseInt(provForm.proveedor_id),
          precio_costo: provForm.precio_costo ? parseFloat(provForm.precio_costo) : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al agregar");
      setProvForm({ proveedor_id: "", precio_costo: "" });
      setMostrarFormProv(false);
      await cargarProveedores();
      mostrarExito("Proveedor agregado correctamente");
    } catch (err) {
      mostrarError(err.message);
    }
    setGuardandoProv(false);
  };

  const guardarPrecioProv = async (id) => {
    try {
      const r = await fetch(`${API_PROV}/proveedores-producto/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ precio_costo: provEditPrecio ? parseFloat(provEditPrecio) : null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al actualizar");
      setProvEditId(null);
      setProvEditPrecio("");
      await cargarProveedores();
      mostrarExito("Precio actualizado");
    } catch (err) {
      mostrarError(err.message);
    }
  };

  const eliminarProveedor = async (id) => {
    if (!window.confirm("¿Quitar este proveedor del producto?")) return;
    try {
      const r = await fetch(`${API_PROV}/proveedores-producto/${id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al eliminar");
      await cargarProveedores();
      mostrarExito("Proveedor eliminado");
    } catch (err) {
      mostrarError(err.message);
    }
  };

  const actualizarStock = async (varianteId, cantidad) => {
    const r = await fetch(`${API}/${producto.id}/variantes/${varianteId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad: parseInt(cantidad) }),
    });
    if (r.ok) {
      setStockEdit({});
      await recargar();
      mostrarExito("Stock actualizado");
    } else {
      mostrarError("Error al actualizar stock");
    }
  };

  const eliminarVariante = async (varianteId) => {
    if (!window.confirm("¿Eliminar esta variante?")) return;
    const r = await fetch(`${API}/${producto.id}/variantes/${varianteId}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) { mostrarError(d.error || "Error al eliminar"); return; }
    await recargar();
    mostrarExito("Variante eliminada");
  };

  const abrirEdicion = (v) => {
    setVarEditId(v.id);
    setVarEditForm({ sku: v.sku, precio_adicional: v.precio_adicional || 0, color_id: v.color_id || "", imagen_url: v.imagen_url || null });
    setImagenPreview(v.imagen_url || null);
    setError("");
  };

  const cancelarEdicion = () => { setVarEditId(null); setVarEditForm({}); setImagenPreview(null); };

  const seleccionarImagen = async (file) => {
    if (!file) return;
    setSubiendoImagen(true);
    try {
      const url = await subirImagen(file, "variantes");
      setImagenPreview(url);
      setVarEditForm(f => ({ ...f, imagen_url: url }));
      mostrarExito("Imagen subida correctamente");
    } catch (err) {
      mostrarError(err.message);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const quitarImagen = () => { setImagenPreview(null); setVarEditForm(f => ({ ...f, imagen_url: null })); };
  
  const guardarEdicion = async (varianteId) => {
    if (!varEditForm.sku?.trim()) { mostrarError("El SKU es requerido"); return; }
    const r = await fetch(`${API}/${producto.id}/variantes/${varianteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: varEditForm.sku.trim().toUpperCase(),
        precio_adicional: parseFloat(varEditForm.precio_adicional) || 0,
        color_id: varEditForm.color_id ? parseInt(varEditForm.color_id) : null,
        imagen_url: varEditForm.imagen_url || null,
      }),
    });
    const d = await r.json();
    if (!r.ok) { mostrarError(d.error || "Error al guardar"); return; }
    cancelarEdicion();
    await recargar();
    mostrarExito("Variante actualizada");
  };

  // Proveedores ya asignados (para excluirlos del select)
  const idsAsignados = proveedores.map(p => p.proveedor_id);
  const proveedoresDisponibles = todosProveedores.filter(p => !idsAsignados.includes(p.proveedor_id));

  return (
    <>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>{producto.nombre}</h1>
          <p style={{ margin: "2px 0 0", color: C.textoMuted, fontSize: "0.85rem" }}>Detalle · #{producto.id}</p>
        </div>
        <button style={S.btnSecondary} onClick={onVolver}>← Volver</button>
      </div>
      {error && <div style={S.error}>{error}</div>}
      {exito && <div style={S.success}>{exito}</div>}

      {/* Info general */}
      <div style={{ ...S.card, display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", alignItems: "start" }}>
        {producto.imagen_url
          ? <img src={producto.imagen_url} alt={producto.nombre} style={{ width: "130px", height: "130px", objectFit: "cover", borderRadius: "14px" }} />
          : <div style={{ width: "130px", height: "130px", background: "#E6F4F4", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal2, fontSize: "2.5rem" }}>📷</div>
        }
        <div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: C.teal1, marginBottom: "6px" }}>{producto.nombre}</div>
          <div style={{ color: C.textoSub, fontSize: "0.9rem", marginBottom: "14px" }}>{producto.descripcion || "Sin descripción"}</div>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div><span style={{ color: C.textoMuted, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Precio base</span><div style={{ fontWeight: 700, fontSize: "1.1rem", color: C.teal1 }}>${parseFloat(producto.precio_base).toFixed(2)}</div></div>
            <div><span style={{ color: C.textoMuted, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Categoría</span><div style={{ fontWeight: 700 }}>{producto.categoria_nombre}</div></div>
            <div><span style={{ color: C.textoMuted, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Marca</span><div style={{ fontWeight: 700 }}>{producto.marca_nombre || "—"}</div></div>
          </div>
        </div>
      </div>

      {/* Variantes */}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Variantes ({producto.variantes?.length || 0})</h3>
        {!producto.variantes?.length
          ? <p style={{ color: C.textoMuted, textAlign: "center", padding: "2rem" }}>Sin variantes</p>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>{["Imagen","SKU","Color","Atributos","Precio final","Stock","Estado","Acciones"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {producto.variantes.map((v, i) => {
                    const precioFinal = parseFloat(producto.precio_base) + parseFloat(v.precio_adicional || 0);
                    const st = v.stock || 0;
                    const stMin = v.stock_minimo || 5;
                    const editando = varEditId === v.id;

                    return (
                      <tr key={v.id} style={{ background: i % 2 === 0 ? C.blanco : "#FAFCFC" }}>
                        <td style={S.td}>
                          {editando ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                              {imagenPreview ? (
                                <div style={{ position: "relative" }}>
                                  <img src={imagenPreview} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                                  <button onClick={quitarImagen} style={{ position: "absolute", top: "-6px", right: "-6px", width: "18px", height: "18px", borderRadius: "50%", background: C.rojo, color: C.blanco, border: "none", cursor: "pointer", fontSize: "10px" }}>✕</button>
                                </div>
                              ) : (
                                <label style={{ cursor: "pointer" }}>
                                  <div style={{ width: "60px", height: "60px", background: "#E6F4F4", border: `1.5px dashed ${C.teal2}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal1, fontSize: "1.2rem" }}>
                                    {subiendoImagen ? "⏳" : "+"}
                                  </div>
                                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => seleccionarImagen(e.target.files[0])} disabled={subiendoImagen} />
                                </label>
                              )}
                            </div>
                          ) : (
                            v.imagen_url
                              ? <img src={v.imagen_url} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />
                              : <div style={{ width: "40px", height: "40px", background: "#E6F4F4", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: C.teal2 }}>📷</div>
                          )}
                        </td>
                        <td style={{ ...S.td, fontFamily: "monospace", fontSize: "0.82rem" }}>
                          {editando
                            ? <input style={{ ...S.input, padding: "5px 8px", width: "140px", fontFamily: "monospace" }} value={varEditForm.sku} onChange={e => setVarEditForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))} />
                            : v.sku}
                        </td>
                        <td style={S.td}>
                          {editando
                            ? <select style={{ ...S.select, padding: "5px 8px", width: "130px" }} value={varEditForm.color_id} onChange={e => setVarEditForm(f => ({ ...f, color_id: e.target.value }))}>
                                <option value="">Sin color</option>
                                {catalogos.colores.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                              </select>
                            : v.color_nombre || "—"}
                        </td>
                        <td style={S.td}>
                          {v.atributos?.map(a => (
                            <span key={a.tipo_atributo_id} style={{ display: "inline-block", padding: "2px 9px", borderRadius: "12px", background: "#E6F4F4", color: C.teal1, fontSize: "0.74rem", fontWeight: 700, marginRight: "4px", marginBottom: "2px" }}>
                              {a.tipo_nombre}: {a.valor_nombre}
                            </span>
                          ))}
                        </td>
                        <td style={{ ...S.td, fontWeight: 700, color: C.teal1 }}>
                          {editando
                            ? <div>
                                <input type="number" step="0.01" style={{ ...S.input, padding: "5px 8px", width: "90px" }} value={varEditForm.precio_adicional} onChange={e => setVarEditForm(f => ({ ...f, precio_adicional: e.target.value }))} />
                                <div style={{ fontSize: "0.72rem", color: C.textoMuted, marginTop: "2px" }}>Total: ${(parseFloat(producto.precio_base) + parseFloat(varEditForm.precio_adicional || 0)).toFixed(2)}</div>
                              </div>
                            : `$${precioFinal.toFixed(2)}`}
                        </td>
                        <td style={S.td}>
                          {stockEdit[v.id] !== undefined
                            ? <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <input type="number" min="0" style={{ ...S.input, width: "70px", padding: "5px 8px" }} value={stockEdit[v.id]} onChange={e => setStockEdit(s => ({ ...s, [v.id]: e.target.value }))} />
                                <button style={S.btnSuccess} onClick={() => actualizarStock(v.id, stockEdit[v.id])}>✓</button>
                                <button style={S.btnDanger} onClick={() => setStockEdit(s => { const n = { ...s }; delete n[v.id]; return n; })}>✕</button>
                              </div>
                            : <span onClick={() => setStockEdit(s => ({ ...s, [v.id]: st }))} style={{ cursor: "pointer", fontWeight: 700, color: C.teal1, textDecoration: "underline dotted" }} title="Click para editar">{st} unidades</span>
                          }
                        </td>
                        <td style={S.td}>{badge(st === 0 ? "red" : st <= stMin ? "yellow" : "green", st === 0 ? "Sin stock" : st <= stMin ? "Stock bajo" : "OK")}</td>
                        <td style={S.td}>
                          {editando
                            ? <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                <button style={S.btnSuccess} onClick={() => guardarEdicion(v.id)} disabled={subiendoImagen}>✓ Guardar</button>
                                <button style={S.btnSecondary} onClick={cancelarEdicion}>Cancelar</button>
                              </div>
                            : <div style={{ display: "flex", gap: "6px" }}>
                                <button style={S.btnWarning} onClick={() => abrirEdicion(v)}>✏️</button>
                                <button style={S.btnDanger} onClick={() => eliminarVariante(v.id)}>🗑️</button>
                              </div>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* ── Proveedores ── */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h3 style={{ ...S.cardTitle, margin: 0 }}>🏭 Proveedores ({proveedores.length})</h3>
          {!mostrarFormProv && proveedoresDisponibles.length > 0 && (
            <button style={S.btnPrimary} onClick={() => setMostrarFormProv(true)}>+ Agregar proveedor</button>
          )}
        </div>

        {/* Formulario agregar */}
        {mostrarFormProv && (
          <div style={{ background: "#F0F8F7", border: `1px solid ${C.teal2}`, borderRadius: "12px", padding: "1.2rem", marginBottom: "1.2rem" }}>
            <div style={{ ...S.grid2, marginBottom: "1rem" }}>
              <div>
                <label style={S.label}>Proveedor *</label>
                <select style={S.select} value={provForm.proveedor_id} onChange={e => setProvForm(f => ({ ...f, proveedor_id: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {proveedoresDisponibles.map(p => (
                    <option key={p.proveedor_id} value={p.proveedor_id}>{p.nombre_proveedor}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.label}>Precio de costo ($)</label>
                <input style={S.input} type="number" step="0.01" min="0" placeholder="Opcional" value={provForm.precio_costo} onChange={e => setProvForm(f => ({ ...f, precio_costo: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button style={S.btnSecondary} onClick={() => { setMostrarFormProv(false); setProvForm({ proveedor_id: "", precio_costo: "" }); }}>Cancelar</button>
              <button style={{ ...S.btnPrimary, opacity: guardandoProv ? 0.6 : 1 }} onClick={agregarProveedor} disabled={guardandoProv}>
                {guardandoProv ? "Guardando..." : "✓ Agregar"}
              </button>
            </div>
          </div>
        )}

        {/* Tabla proveedores */}
        {proveedores.length === 0
          ? <p style={{ color: C.textoMuted, textAlign: "center", padding: "2rem" }}>Sin proveedores asignados</p>
          : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead>
                  <tr>{["Proveedor","Contacto","Teléfono","Correo","Precio costo","Desde","Acciones"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {proveedores.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? C.blanco : "#FAFCFC" }}>
                      <td style={{ ...S.td, fontWeight: 700 }}>{p.nombre_proveedor}</td>
                      <td style={S.td}>{p.contacto_nombre || "—"}</td>
                      <td style={S.td}>{p.telefono || "—"}</td>
                      <td style={S.td}>{p.correo_electronico || "—"}</td>
                      <td style={{ ...S.td, fontWeight: 700, color: C.teal1 }}>
                        {provEditId === p.id
                          ? <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input type="number" step="0.01" min="0" style={{ ...S.input, width: "100px", padding: "5px 8px" }} value={provEditPrecio} onChange={e => setProvEditPrecio(e.target.value)} />
                              <button style={S.btnSuccess} onClick={() => guardarPrecioProv(p.id)}>✓</button>
                              <button style={S.btnDanger} onClick={() => { setProvEditId(null); setProvEditPrecio(""); }}>✕</button>
                            </div>
                          : <span onClick={() => { setProvEditId(p.id); setProvEditPrecio(p.precio_costo || ""); }} style={{ cursor: "pointer", textDecoration: "underline dotted" }} title="Click para editar">
                              {p.precio_costo ? `$${parseFloat(p.precio_costo).toFixed(2)}` : "—"}
                            </span>
                        }
                      </td>
                      <td style={{ ...S.td, fontSize: "0.8rem", color: C.textoMuted }}>
                        {new Date(p.fecha_registro).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={S.td}>
                        <button style={S.btnDanger} onClick={() => eliminarProveedor(p.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </>
  );
}