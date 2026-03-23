import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/admin/contactos";

export default function AdminContactos() {
  const [contactos, setContactos] = useState([]);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setContactos(data);
    } catch {
      setError("No se pudieron cargar los contactos.");
    }
  };

  const crear = async () => {
    if (!tipo.trim() || !valor.trim()) {
      setError("El tipo y el valor son requeridos");
      return;
    }
    setError(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, tipo_contacto: tipo, valor_contacto: valor }),
      });
      if (!res.ok) throw new Error("Error al agregar");
      setTipo("");
      setValor("");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📞</div>
        <h2>Contactos</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input
          className="empresa-input"
          placeholder="Tipo (ej. Teléfono)"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
        <input
          className="empresa-input"
          placeholder="Valor (ej. +52 123 456 7890)"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button className="btn-agregar" onClick={crear}>Agregar</button>
      </div>

      <div className="empresa-item-list">
        {contactos.map((c) => (
          <div key={c.contacto_id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{c.tipo_contacto}</strong>
              <div className="empresa-item-sub">{c.valor_contacto}</div>
            </div>
            <button className="btn-eliminar-item" onClick={() => eliminar(c.contacto_id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}