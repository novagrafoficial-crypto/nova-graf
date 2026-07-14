import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/valores`;

export default function AdminValores() {
  const [valores, setValores] = useState([]);
  const [valor, setValor] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setValores(data);
    } catch { setError("No se pudieron cargar los valores."); }
  };

  const guardar = async () => {
    if (!valor.trim() || !descripcion.trim()) {
      setError("El valor y la descripción son requeridos");
      return;
    }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, valor, descripcion }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setValor("");
      setDescripcion("");
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleEditar = (v) => {
    setValor(v.valor);
    setDescripcion(v.descripcion);
    setEditandoId(v.id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este valor?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = () => {
    setValor("");
    setDescripcion("");
    setEditandoId(null);
    setError(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">⭐</div>
        <h2>Valores</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input className="empresa-input" placeholder="Valor (ej. Calidad)" value={valor} onChange={(e) => setValor(e.target.value)} />
        <input className="empresa-input" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <button className="btn-agregar" onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && (
          <button className="btn-agregar" onClick={handleCancelar}
            style={{ background: "#e0f0ee", color: "#1A6163", border: "1px solid #35BA99" }}>
            Cancelar
          </button>
        )}
      </div>

      <div className="empresa-item-list">
        {valores.map((v) => (
          <div key={v.id} className="empresa-item">
            <div className="empresa-item-text">
              <strong style={{ color: "#1A6163" }}>{v.valor}</strong>
              <div className="empresa-item-sub">{v.descripcion}</div>
            </div>
            <div className="empresa-item-actions">
              <button className="btn-agregar" onClick={() => handleEditar(v)}>Editar</button>
              <button className="btn-eliminar-item" onClick={() => handleEliminar(v.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}