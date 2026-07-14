import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/metodos-pago`;

const TIPO_ICONS = {
  TRANSFERENCIA: "🏦",
  DEPOSITO: "💳",
  EFECTIVO: "💵",
  default: "💰"
};

const FORM_NUEVO = {
  nombre: "", tipo: "TRANSFERENCIA", descripcion: "", instrucciones: "",
  requiere_comprobante: true, activo: true, orden: 1,
  datos_bancarios: { banco: "", beneficiario: "", cuenta: "", clabe: "", referencia: "" }
};

export default function AdminDatosBancarios() {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState(null);
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [formNuevo, setFormNuevo] = useState(FORM_NUEVO);

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
      nombre: m.nombre || "",
      descripcion: m.descripcion || "",
      instrucciones: m.instrucciones || "",
      requiere_comprobante: m.requiere_comprobante ?? true,
      activo: m.activo ?? true,
      orden: m.orden || 1,
      datos_bancarios: {
        banco: m.datos_bancarios?.banco || "",
        beneficiario: m.datos_bancarios?.beneficiario || "",
        cuenta: m.datos_bancarios?.cuenta || "",
        clabe: m.datos_bancarios?.clabe || "",
        referencia: m.datos_bancarios?.referencia || "",
      }
    });
    setStatus(null);
  };

  const guardar = async () => {
    try {
      const res = await fetch(`${API}/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error al guardar");
      mostrarStatus("ok", "Datos actualizados correctamente");
      setEditandoId(null);
      cargar();
    } catch (err) {
      mostrarStatus("error", err.message);
    }
  };

  const guardarNuevo = async () => {
    if (!formNuevo.nombre.trim()) { mostrarStatus("error", "El nombre es requerido"); return; }
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formNuevo),
      });
      if (!res.ok) throw new Error("Error al crear");
      mostrarStatus("ok", "Método de pago creado correctamente");
      setMostrarFormNuevo(false);
      setFormNuevo(FORM_NUEVO);
      cargar();
    } catch (err) {
      mostrarStatus("error", err.message);
    }
  };

  const toggleActivo = async (id, activo) => {
    await fetch(`${API}/${id}/activo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    cargar();
  };

  const handleDatosBancarios = (campo, valor) => {
    setForm(f => ({ ...f, datos_bancarios: { ...f.datos_bancarios, [campo]: valor } }));
  };

  const camposBancarios = [
    { label: "Banco", key: "banco", placeholder: "Ej: BBVA, Banamex" },
    { label: "Beneficiario", key: "beneficiario", placeholder: "Nombre del titular" },
    { label: "No. de cuenta", key: "cuenta", placeholder: "Ej: 1234567890" },
    { label: "CLABE interbancaria", key: "clabe", placeholder: "18 dígitos" },
    { label: "Referencia", key: "referencia", placeholder: "Opcional" },
  ];

  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #d4eeea", fontSize: "13px", outline: "none", boxSizing: "border-box" };

  if (loading) return <p style={{ padding: "2rem", color: "#999" }}>Cargando...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "#1A6163", fontSize: "22px", fontWeight: 500, margin: 0 }}>Datos Bancarios</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "4px 0 0" }}>Gestiona los métodos de pago y cuentas bancarias de Nova Graf</p>
        </div>
        <button onClick={() => setMostrarFormNuevo(!mostrarFormNuevo)} style={{
          padding: "10px 20px", borderRadius: "8px", border: "none",
          background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
        }}>
          + Nuevo método
        </button>
      </div>

      {/* Status */}
      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px", marginBottom: "1rem", fontSize: "13px", fontWeight: 500,
          background: status.tipo === "ok" ? "#d4f5eb" : "#ffd6d6",
          color: status.tipo === "ok" ? "#0F6E56" : "#8b0000",
          borderLeft: `3px solid ${status.tipo === "ok" ? "#35BA99" : "#dc3545"}`,
        }}>{status.msg}</div>
      )}

      {/* Formulario nuevo */}
      {mostrarFormNuevo && (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", padding: "1.25rem", marginBottom: "1rem" }}>
          <h3 style={{ color: "#1A6163", fontSize: "15px", marginBottom: "1rem" }}>Nuevo método de pago</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Nombre *</label>
              <input value={formNuevo.nombre} onChange={e => setFormNuevo(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Transferencia BBVA" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Tipo *</label>
              <select value={formNuevo.tipo} onChange={e => setFormNuevo(f => ({ ...f, tipo: e.target.value }))}
                style={{ ...inputStyle }}>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="DEPOSITO">Depósito</option>
                <option value="EFECTIVO">Efectivo</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Orden</label>
              <input type="number" value={formNuevo.orden} onChange={e => setFormNuevo(f => ({ ...f, orden: parseInt(e.target.value) }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Descripción</label>
              <input value={formNuevo.descripcion} onChange={e => setFormNuevo(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Breve descripción" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Instrucciones para el cliente</label>
              <textarea value={formNuevo.instrucciones} onChange={e => setFormNuevo(f => ({ ...f, instrucciones: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>

          {formNuevo.tipo !== "EFECTIVO" && (
            <>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A6163", margin: "0 0 1rem", paddingTop: "1rem", borderTop: "1px solid #e0f0ee" }}>Datos bancarios</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {camposBancarios.map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>{label}</label>
                    <input value={formNuevo.datos_bancarios[key]}
                      onChange={e => setFormNuevo(f => ({ ...f, datos_bancarios: { ...f.datos_bancarios, [key]: e.target.value } }))}
                      placeholder={placeholder} style={{ ...inputStyle, fontFamily: key === "cuenta" || key === "clabe" ? "monospace" : "inherit" }} />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input type="checkbox" id="comprobante-nuevo" checked={formNuevo.requiere_comprobante}
                    onChange={e => setFormNuevo(f => ({ ...f, requiere_comprobante: e.target.checked }))} />
                  <label htmlFor="comprobante-nuevo" style={{ fontSize: "13px", color: "#333" }}>Requiere comprobante</label>
                </div>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={guardarNuevo} style={{
              padding: "10px 24px", borderRadius: "8px", border: "none",
              background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
            }}>Guardar</button>
            <button onClick={() => { setMostrarFormNuevo(false); setFormNuevo(FORM_NUEVO); }}
              style={{ padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de métodos */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {metodos.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No hay métodos de pago registrados.</p>
        ) : metodos.map(m => (
          <div key={m.id} style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>

            {/* Header del método */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: editandoId === m.id ? "1px solid #d4eeea" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>{TIPO_ICONS[m.tipo] || TIPO_ICONS.default}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#1A6163" }}>{m.nombre}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>{m.tipo} · Orden: {m.orden}</p>
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

            {/* Vista previa datos bancarios */}
            {editandoId !== m.id && m.datos_bancarios && Object.keys(m.datos_bancarios).some(k => m.datos_bancarios[k]) && (
              <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {camposBancarios.filter(c => m.datos_bancarios[c.key]).map(({ label, key }) => (
                  <div key={key}>
                    <p style={{ margin: 0, fontSize: "11px", color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 500, fontFamily: key === "cuenta" || key === "clabe" ? "monospace" : "inherit" }}>
                      {m.datos_bancarios[key]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario edición */}
            {editandoId === m.id && (
              <div style={{ padding: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Nombre</label>
                    <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Orden</label>
                    <input type="number" value={form.orden} onChange={e => setForm(f => ({ ...f, orden: parseInt(e.target.value) }))} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Descripción</label>
                    <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>Instrucciones para el cliente</label>
                    <textarea value={form.instrucciones} onChange={e => setForm(f => ({ ...f, instrucciones: e.target.value }))}
                      rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>

                {m.tipo !== "EFECTIVO" && (
                  <>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A6163", margin: "0 0 1rem", paddingTop: "1rem", borderTop: "1px solid #e0f0ee" }}>Datos bancarios</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                      {camposBancarios.map(({ label, key, placeholder }) => (
                        <div key={key}>
                          <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "6px" }}>{label}</label>
                          <input value={form.datos_bancarios[key]} onChange={e => handleDatosBancarios(key, e.target.value)}
                            placeholder={placeholder}
                            style={{ ...inputStyle, fontFamily: key === "cuenta" || key === "clabe" ? "monospace" : "inherit" }} />
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="checkbox" id={`comprobante-${m.id}`} checked={form.requiere_comprobante}
                          onChange={e => setForm(f => ({ ...f, requiere_comprobante: e.target.checked }))} />
                        <label htmlFor={`comprobante-${m.id}`} style={{ fontSize: "13px", color: "#333" }}>Requiere comprobante</label>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={guardar} style={{
                    padding: "10px 24px", borderRadius: "8px", border: "none",
                    background: "linear-gradient(135deg, #1A6163, #35BA99)", color: "#fff", cursor: "pointer", fontWeight: 600
                  }}>Guardar cambios</button>
                  <button onClick={() => setEditandoId(null)} style={{
                    padding: "10px 24px", borderRadius: "8px", border: "1.5px solid #d4eeea", background: "#fff", cursor: "pointer"
                  }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}