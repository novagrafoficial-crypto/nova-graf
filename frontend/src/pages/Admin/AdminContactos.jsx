import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/admin/contactos";

export default function AdminContactos() {
  const [contactos, setContactos] = useState([]);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      setContactos(await res.json());
    } catch { setError("No se pudieron cargar los contactos."); }
  };

  const guardar = async () => {
    if (!tipo.trim() || !valor.trim()) {
      setError("El tipo y el valor son requeridos");
      return;
    }
    setError(null);
    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, tipo_contacto: tipo, valor_contacto: valor }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      setTipo("");
      setValor("");
      setEditandoId(null);
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleEditar = (c) => {
    setTipo(c.tipo_contacto);
    setValor(c.valor_contacto);
    setEditandoId(c.contacto_id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) { setError(err.message); }
  };

  const handleCancelar = () => {
    setTipo("");
    setValor("");
    setEditandoId(null);
    setError(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📞</div>
        <h2>Contactos</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input className="empresa-input" placeholder="Tipo (ej. Teléfono)" value={tipo} onChange={(e) => setTipo(e.target.value)} />
        <input className="empresa-input" placeholder="Valor (ej. +52 123 456 7890)" value={valor} onChange={(e) => setValor(e.target.value)} />
        <button className="btn-agregar" onClick={guardar}>{editandoId ? "Actualizar" : "Agregar"}</button>
        {editandoId && <button className="btn-agregar" onClick={handleCancelar} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancelar</button>}
      </div>

      <div className="empresa-item-list">
        {contactos.map((c) => (
          <div key={c.contacto_id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{c.tipo_contacto}</strong>
              <div className="empresa-item-sub">{c.valor_contacto}</div>
            </div>
            <button className="btn-agregar" onClick={() => handleEditar(c)}>Editar</button>
            <button className="btn-eliminar-item" onClick={() => handleEliminar(c.contacto_id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}