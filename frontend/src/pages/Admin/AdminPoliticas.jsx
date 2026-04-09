import { useEffect, useState } from "react";

// ✅ URL dinámica con fallback para desarrollo local
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = `${API_BASE}/api/admin/politicas`;

export default function AdminPoliticas() {
  const [politicas, setPoliticas] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      setPoliticas(await res.json());
    } catch { setError("No se pudieron cargar las políticas."); }
  };

  const guardar = async () => {
    if (!descripcion.trim()) { setError("La descripción es requerida"); return; }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, descripcion }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setDescripcion("");
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleEditar = (p) => {
    setDescripcion(p.descripcion);
    setEditandoId(p.id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta política?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = () => {
    setDescripcion("");
    setEditandoId(null);
    setError(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📋</div>
        <h2>Políticas</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <textarea
          className="empresa-textarea"
          placeholder="Descripción de la política"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ minHeight: "70px" }}
        />
        <button className="btn-agregar" onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button className="btn-agregar" onClick={handleCancelar} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancelar</button>}
      </div>

      <div className="empresa-item-list">
        {politicas.map((p) => (
          <div key={p.id} className="empresa-item">
            <span className="empresa-item-text">{p.descripcion}</span>
            <button className="btn-agregar" onClick={() => handleEditar(p)}>Editar</button>
            <button className="btn-eliminar-item" onClick={() => handleEliminar(p.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}