import { useEffect, useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin`;

const TABS = ["Marcas", "Categorías", "Subcategorías"];

const estilos = {
  input: { padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", minWidth: "200px" },
  btnPrimary: { padding: "10px 20px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "13px" },
  btnEditar: { padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #35BA99", background: "#fff", color: "#1A6163", cursor: "pointer", fontSize: "12px", fontWeight: 600, marginRight: "6px" },
  btnEliminar: { padding: "6px 14px", borderRadius: "8px", border: "none", background: "#ffd6d6", color: "#8b0000", cursor: "pointer", fontSize: "12px", fontWeight: 600 },
  btnCancelar: { padding: "10px 20px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer", fontSize: "13px" },
  tabla: { width: "100%", borderCollapse: "collapse", fontSize: "13px", marginTop: "1rem" },
  th: { padding: "10px 14px", textAlign: "left", background: "#f0fafa", color: "#1A6163", fontWeight: 600, borderBottom: "2px solid #35BA99" },
  td: { padding: "10px 14px", borderBottom: "1px solid #e0f0ee" },
};

export default function AdminCatalogo() {
  const [tab, setTab] = useState("Marcas");

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "1.5rem", background: "#f0fafa", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: "13px",
            background: tab === t ? "#1A6163" : "transparent",
            color: tab === t ? "#fff" : "#666",
          }}>{t}</button>
        ))}
      </div>

      {tab === "Marcas" && <SeccionMarcas />}
      {tab === "Categorías" && <SeccionCategorias />}
      {tab === "Subcategorías" && <SeccionSubcategorias />}
    </div>
  );
}

function SeccionMarcas() {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = `${API_BASE}/marcas`;

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMarcas(Array.isArray(data) ? data : []);
    } catch { setError("Error al cargar marcas"); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setNombre(""); setEditandoId(null); cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta marca?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div>
      <h2 style={{ color: "#1A6163", fontSize: "18px", marginBottom: "1rem" }}>Marcas</h2>
      {error && <p style={{ color: "#8b0000", background: "#ffd6d6", padding: "10px", borderRadius: "8px", marginBottom: "1rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input style={estilos.input} placeholder="Nombre de la marca" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === "Enter" && guardar()} />
        <button style={estilos.btnPrimary} onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button style={estilos.btnCancelar} onClick={() => { setNombre(""); setEditandoId(null); }}>Cancelar</button>}
      </div>
      {loading ? <p style={{ color: "#999" }}>Cargando...</p> : (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>
          <table style={estilos.tabla}>
            <thead><tr><th style={estilos.th}>ID</th><th style={estilos.th}>Nombre</th><th style={estilos.th}>Acciones</th></tr></thead>
            <tbody>
              {marcas.length === 0
                ? <tr><td colSpan={3} style={{ ...estilos.td, textAlign: "center", color: "#999" }}>No hay marcas</td></tr>
                : marcas.map(m => (
                  <tr key={m.id}>
                    <td style={estilos.td}>#{m.id}</td>
                    <td style={estilos.td}>{m.nombre}</td>
                    <td style={estilos.td}>
                      <button style={estilos.btnEditar} onClick={() => { setNombre(m.nombre); setEditandoId(m.id); }}>Editar</button>
                      <button style={estilos.btnEliminar} onClick={() => eliminar(m.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SeccionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = `${API_BASE}/categorias`;

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch { setError("Error al cargar categorías"); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!nombre.trim()) { setError("El nombre es requerido"); return; }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setNombre(""); setEditandoId(null); cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div>
      <h2 style={{ color: "#1A6163", fontSize: "18px", marginBottom: "1rem" }}>Categorías</h2>
      {error && <p style={{ color: "#8b0000", background: "#ffd6d6", padding: "10px", borderRadius: "8px", marginBottom: "1rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input style={estilos.input} placeholder="Nombre de la categoría" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === "Enter" && guardar()} />
        <button style={estilos.btnPrimary} onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button style={estilos.btnCancelar} onClick={() => { setNombre(""); setEditandoId(null); }}>Cancelar</button>}
      </div>
      {loading ? <p style={{ color: "#999" }}>Cargando...</p> : (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>
          <table style={estilos.tabla}>
            <thead><tr><th style={estilos.th}>ID</th><th style={estilos.th}>Nombre</th><th style={estilos.th}>Acciones</th></tr></thead>
            <tbody>
              {categorias.length === 0
                ? <tr><td colSpan={3} style={{ ...estilos.td, textAlign: "center", color: "#999" }}>No hay categorías</td></tr>
                : categorias.map(c => (
                  <tr key={c.id}>
                    <td style={estilos.td}>#{c.id}</td>
                    <td style={estilos.td}>{c.nombre}</td>
                    <td style={estilos.td}>
                      <button style={estilos.btnEditar} onClick={() => { setNombre(c.nombre); setEditandoId(c.id); }}>Editar</button>
                      <button style={estilos.btnEliminar} onClick={() => eliminar(c.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SeccionSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = `${API_BASE}/subcategorias`;
  const API_CATS = `${API_BASE}/categorias`;

  const cargar = async () => {
    setLoading(true);
    try {
      const [rSub, rCat] = await Promise.all([fetch(API), fetch(API_CATS)]);
      setSubcategorias(await rSub.json());
      setCategorias(await rCat.json());
    } catch { setError("Error al cargar"); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!nombre.trim() || !categoriaId) { setError("El nombre y la categoría son requeridos"); return; }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, categoria_id: categoriaId }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setNombre(""); setCategoriaId(""); setEditandoId(null); cargar();
    } catch (err) { setError(err.message); }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta subcategoría?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div>
      <h2 style={{ color: "#1A6163", fontSize: "18px", marginBottom: "1rem" }}>Subcategorías</h2>
      {error && <p style={{ color: "#8b0000", background: "#ffd6d6", padding: "10px", borderRadius: "8px", marginBottom: "1rem" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input style={estilos.input} placeholder="Nombre de la subcategoría" value={nombre} onChange={e => setNombre(e.target.value)} />
        <select value={categoriaId} onChange={e => setCategoriaId(Number(e.target.value))}
          style={{ ...estilos.input, minWidth: "180px" }}>
          <option value="">Selecciona categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button style={estilos.btnPrimary} onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button style={estilos.btnCancelar} onClick={() => { setNombre(""); setCategoriaId(""); setEditandoId(null); }}>Cancelar</button>}
      </div>
      {loading ? <p style={{ color: "#999" }}>Cargando...</p> : (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>
          <table style={estilos.tabla}>
            <thead><tr><th style={estilos.th}>ID</th><th style={estilos.th}>Nombre</th><th style={estilos.th}>Categoría</th><th style={estilos.th}>Acciones</th></tr></thead>
            <tbody>
              {subcategorias.length === 0
                ? <tr><td colSpan={4} style={{ ...estilos.td, textAlign: "center", color: "#999" }}>No hay subcategorías</td></tr>
                : subcategorias.map(s => (
                  <tr key={s.id}>
                    <td style={estilos.td}>#{s.id}</td>
                    <td style={estilos.td}>{s.nombre}</td>
                    <td style={estilos.td}>{s.categoria_nombre}</td>
                    <td style={estilos.td}>
                      <button style={estilos.btnEditar} onClick={() => { setNombre(s.nombre); setCategoriaId(s.categoria_id); setEditandoId(s.id); }}>Editar</button>
                      <button style={estilos.btnEliminar} onClick={() => eliminar(s.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}