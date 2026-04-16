import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/vision`;

export default function AdminVision() {
  const [visiones, setVisiones] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setVisiones(data);
  };

  const guardar = async () => {
    if (!descripcion.trim()) {
      setStatus({ tipo: "error", msg: "La descripción es requerida" });
      return;
    }
    setStatus(null);
    try {
      const res = await fetch(editandoId ? `${API}/${editandoId}` : API, {
        method: editandoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, descripcion }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setDescripcion("");
      setEditandoId(null);
      setStatus({ tipo: "ok", msg: editandoId ? "Visión actualizada" : "Visión guardada" });
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const handleEditar = (v) => {
    setDescripcion(v.descripcion);
    setEditandoId(v.id);
    setStatus(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta visión?")) return;
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const handleCancelar = () => {
    setDescripcion("");
    setEditandoId(null);
    setStatus(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">🔭</div>
        <h2>Visión</h2>
      </div>

      {status && <p className={`empresa-status ${status.tipo}`}>{status.msg}</p>}

      <div className="empresa-field">
        <textarea
          className="empresa-textarea"
          placeholder="Escribe la visión de la empresa..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn-guardar" onClick={guardar}>
          {editandoId ? "Actualizar" : "Guardar"}
        </button>
        {editandoId && (
          <button className="btn-guardar" onClick={handleCancelar}
            style={{ background: "var(--surface2)", boxShadow: "none" }}>
            Cancelar
          </button>
        )}
      </div>

      <div className="empresa-item-list" style={{ marginTop: "16px" }}>
        {visiones.map((v) => (
          <div key={v.id} className="empresa-item">
            <span className="empresa-item-text">{v.descripcion}</span>
            <button className="btn-agregar" onClick={() => handleEditar(v)}>Editar</button>
            <button className="btn-eliminar-item" onClick={() => handleEliminar(v.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}