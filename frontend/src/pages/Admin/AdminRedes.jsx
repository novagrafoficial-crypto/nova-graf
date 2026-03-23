import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/admin/redes";

export default function AdminRedes() {
  const [redes, setRedes] = useState([]);
  const [red, setRed] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setRedes(data);
    } catch {
      setError("No se pudieron cargar las redes sociales.");
    }
  };

  const crear = async () => {
    if (!red.trim() || !url.trim()) {
      setError("La red social y la URL son requeridas");
      return;
    }
    setError(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, red_social: red, url_red_social: url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear");
      }
      setRed("");
      setUrl("");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta red social?")) return;
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
        <div className="empresa-section-icon">🔗</div>
        <h2>Redes Sociales</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      <div className="empresa-add-row">
        <input
          className="empresa-input"
          placeholder="Red social (ej. Facebook)"
          value={red}
          onChange={(e) => setRed(e.target.value)}
        />
        <input
          className="empresa-input"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className="btn-agregar" onClick={crear}>Agregar</button>
      </div>

      <div className="empresa-item-list">
        {redes.map((r) => (
          <div key={r.red_social_id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{r.red_social}</strong>
              <div className="empresa-item-sub">{r.url_red_social}</div>
            </div>
            <button className="btn-eliminar-item" onClick={() => eliminar(r.red_social_id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}