import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/ubicacion`;
const VACIO = { direccion: "", ciudad: "", pais: "", codigo_postal: "" };

export default function AdminUbicacion() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      setUbicaciones(await res.json());
    } catch { setError("No se pudo cargar la ubicación."); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    if (!form.direccion.trim()) {
      setError("La dirección es requerida");
      return;
    }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, ...form }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setForm(VACIO);
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleEditar = (u) => {
    setForm({
      direccion: u.direccion || "",
      ciudad: u.ciudad || "",
      pais: u.pais || "",
      codigo_postal: u.codigo_postal || "",
    });
    setEditandoId(u.ubicacion_id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta ubicación?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = () => {
    setForm(VACIO);
    setEditandoId(null);
    setError(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📍</div>
        <h2>Ubicación</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input className="empresa-input" name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} />
        <input className="empresa-input" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={handleChange} />
        <input className="empresa-input" name="pais" placeholder="País" value={form.pais} onChange={handleChange} />
        <input className="empresa-input" name="codigo_postal" placeholder="Código Postal" value={form.codigo_postal} onChange={handleChange} style={{ maxWidth: "150px" }} />
        <button className="btn-agregar" onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button className="btn-agregar" onClick={handleCancelar} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancelar</button>}
      </div>

      <div className="empresa-item-list">
        {ubicaciones.map((u) => (
          <div key={u.ubicacion_id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{u.direccion}</strong>
              <div className="empresa-item-sub">
                {[u.ciudad, u.pais, u.codigo_postal].filter(Boolean).join(", ")}
              </div>
            </div>
            <button className="btn-agregar" onClick={() => handleEditar(u)}>Editar</button>
            <button className="btn-eliminar-item" onClick={() => handleEliminar(u.ubicacion_id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}