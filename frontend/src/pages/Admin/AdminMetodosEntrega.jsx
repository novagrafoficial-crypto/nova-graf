import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/metodos-entrega`;

const TIPO_ICONS = {
  ENVIO_LOCAL: "🚚",
  RECOGIDA_FISICA: "🏪",
  PUNTO_MEDIO: "📍",
  default: "📦"
};

const TIPO_LABELS = {
  ENVIO_LOCAL: "Envío local",
  RECOGIDA_FISICA: "Recogida física",
  PUNTO_MEDIO: "Punto medio",
};

const FORM_VACIO = {
  tipo: "ENVIO_LOCAL", nombre: "", descripcion: "", costo: 0, activo: true
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: "8px",
  border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box"
};

const FormularioMetodo = ({ datos, setDatos, onGuardar, onCancelar, titulo }) => (
  <div style={{ padding: "1.25rem" }}>
    <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>{titulo}</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
      <div>
        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Nombre *</label>
        <input value={datos.nombre} onChange={e => setDatos(f => ({ ...f, nombre: e.target.value }))}
          placeholder="Ej: Colonia Centro" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Tipo</label>
        <select value={datos.tipo} onChange={e => setDatos(f => ({ ...f, tipo: e.target.value }))} style={inputStyle}>
          <option value="ENVIO_LOCAL">Envío local</option>
          <option value="RECOGIDA_FISICA">Recogida física</option>
          <option value="PUNTO_MEDIO">Punto medio</option>
        </select>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Descripción</label>
        <input value={datos.descripcion} onChange={e => setDatos(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Breve descripción del método" style={inputStyle} />
      </div>
      <div>
        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Costo ($)</label>
        <input
          type="number" min="0" step="0.01"
          value={datos.costo}
          onChange={e => setDatos(f => ({ ...f, costo: e.target.value === "" ? "" : e.target.value }))}
          onBlur={e => setDatos(f => ({ ...f, costo: parseFloat(e.target.value) || 0 }))}
          style={inputStyle}
        />
      </div>
    </div>
    <div style={{ display: "flex", gap: "10px" }}>
      <button onClick={onGuardar} style={{
        padding: "10px 24px", borderRadius: "8px", border: "none",
        background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
      }}>Guardar</button>
      <button onClick={onCancelar} style={{
        padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer"
      }}>Cancelar</button>
    </div>
  </div>
);

export default function AdminMetodosEntrega() {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState(FORM_VACIO);
  const [status, setStatus] = useState(null);
  const [filtro, setFiltro] = useState("TODOS");

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMetodos(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const mostrarStatus = (tipo, msg) => {
    setStatus({ tipo, msg });
    setTimeout(() => setStatus(null), 3000);
  };

  const abrirEditar = (m) => {
    setEditandoId(m.id);
    setForm({
      tipo: m.tipo || "ENVIO_LOCAL",
      nombre: m.nombre || "",
      descripcion: m.descripcion || "",
      costo: m.costo ?? 0,
      activo: m.activo ?? true,
    });
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { mostrarStatus("error", "El nombre es requerido"); return; }
    try {
      const res = await fetch(`${API}/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, costo: parseFloat(form.costo) || 0 }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      mostrarStatus("ok", "Método actualizado correctamente");
      setEditandoId(null);
      cargar();
    } catch (err) { mostrarStatus("error", err.message); }
  };

  const guardarNuevo = async () => {
    if (!formNuevo.nombre.trim()) { mostrarStatus("error", "El nombre es requerido"); return; }
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formNuevo, costo: parseFloat(formNuevo.costo) || 0 }),
      });
      if (!res.ok) throw new Error("Error al crear");
      mostrarStatus("ok", "Método de entrega creado correctamente");
      setMostrarFormNuevo(false);
      setFormNuevo(FORM_VACIO);
      cargar();
    } catch (err) { mostrarStatus("error", err.message); }
  };

  const toggleActivo = async (id, activo) => {
    await fetch(`${API}/${id}/activo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    cargar();
  };

  const metodosFiltrados = filtro === "TODOS" ? metodos : metodos.filter(m => m.tipo === filtro);

  if (loading) return <p style={{ padding: "2rem", color: "#999" }}>Cargando...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "#1A6163", fontSize: "22px", fontWeight: 500, margin: 0 }}>Métodos de Entrega</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "4px 0 0" }}>{metodos.length} métodos registrados</p>
        </div>
        <button onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)} style={{
          padding: "10px 20px", borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
        }}>
          + Nuevo método
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {["TODOS", "ENVIO_LOCAL", "RECOGIDA_FISICA", "PUNTO_MEDIO"].map(t => (
          <button key={t} onClick={() => setFiltro(t)} style={{
            padding: "6px 16px", borderRadius: "20px", border: "1.5px solid",
            cursor: "pointer", fontSize: "12px", fontWeight: 500,
            background: filtro === t ? "#1A6163" : "transparent",
            color: filtro === t ? "#fff" : "#1A6163",
            borderColor: "#1A6163",
          }}>
            {t === "TODOS" ? "Todos" : TIPO_LABELS[t]}
          </button>
        ))}
      </div>

      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontSize: "13px", fontWeight: 500,
          background: status.tipo === "ok" ? "#d4f5eb" : "#ffd6d6",
          color: status.tipo === "ok" ? "#0F6E56" : "#8b0000",
          borderLeft: `3px solid ${status.tipo === "ok" ? "#35BA99" : "#dc3545"}`,
        }}>{status.msg}</div>
      )}

      {mostrarFormNuevo && (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", marginBottom: "1rem", overflow: "hidden" }}>
          <FormularioMetodo
            datos={formNuevo}
            setDatos={setFormNuevo}
            onGuardar={guardarNuevo}
            onCancelar={() => { setMostrarFormNuevo(false); setFormNuevo(FORM_VACIO); }}
            titulo="Nuevo método de entrega"
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {metodosFiltrados.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay métodos de entrega registrados.</p>
        ) : metodosFiltrados.map(m => (
          <div key={m.id} style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: editandoId === m.id ? "1px solid #d4eeea" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>{TIPO_ICONS[m.tipo] || TIPO_ICONS.default}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#1A6163" }}>{m.nombre}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                    {TIPO_LABELS[m.tipo] || m.tipo} · ${parseFloat(m.costo || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{
                  padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                  background: m.activo ? "#d4f5eb" : "#f0f0f0",
                  color: m.activo ? "#0F6E56" : "#666"
                }}>
                  {m.activo ? "Activo" : "Inactivo"}
                </span>
                <button onClick={() => toggleActivo(m.id, m.activo)} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600,
                  background: m.activo ? "#ffd6d6" : "#d4f5eb",
                  color: m.activo ? "#8b0000" : "#0F6E56"
                }}>
                  {m.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => editandoId === m.id ? setEditandoId(null) : abrirEditar(m)} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "1.5px solid #35BA99",
                  background: "#fff", color: "#1A6163", cursor: "pointer", fontSize: "12px", fontWeight: 600
                }}>
                  {editandoId === m.id ? "Cancelar" : "Editar"}
                </button>
              </div>
            </div>

            {editandoId !== m.id && m.descripcion && (
              <div style={{ padding: "0.75rem 1.25rem", background: "#f4fdfb" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>{m.descripcion}</p>
              </div>
            )}

            {editandoId === m.id && (
              <FormularioMetodo
                datos={form}
                setDatos={setForm}
                onGuardar={guardar}
                onCancelar={() => setEditandoId(null)}
                titulo="Editar método de entrega"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}