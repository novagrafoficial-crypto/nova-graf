import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const API = `${API_URL}/api/admin/antecedentes`;


export default function AdminAntecedentes() {
  const [antecedentes, setAntecedentes] = useState([]);
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      setAntecedentes(await res.json());
    } catch { setError("No se pudieron cargar los antecedentes."); }
  };

  const guardar = async () => {
    if (!descripcion.trim() || !fecha) {
      setError("La descripción y la fecha son requeridas");
      return;
    }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, descripcion, fecha_evento: fecha }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setDescripcion("");
      setFecha("");
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleEditar = (a) => {
    setDescripcion(a.descripcion);
    setFecha(a.fecha_evento?.slice(0, 10));
    setEditandoId(a.id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este antecedente?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = () => {
    setDescripcion("");
    setFecha("");
    setEditandoId(null);
    setError(null);
  };

  const formatFecha = (f) => {
    if (!f) return "";
    return new Date(f).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📅</div>
        <h2>Antecedentes</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input className="empresa-input" placeholder="Descripción del evento" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <input className="empresa-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ maxWidth: "180px" }} />
        <button className="btn-agregar" onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button className="btn-agregar" onClick={handleCancelar} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancelar</button>}
      </div>

      <div className="empresa-item-list">
        {antecedentes.map((a) => (
          <div key={a.id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{a.descripcion}</strong>
              <div className="empresa-item-sub">{formatFecha(a.fecha_evento)}</div>
            </div>
            <button className="btn-agregar" onClick={() => handleEditar(a)}>Editar</button>
            <button className="btn-eliminar-item" onClick={() => handleEliminar(a.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}