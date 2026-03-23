import { useEffect, useState } from "react";

const API = "http://localhost:5000/api/admin/ubicacion";

const VACIO = { direccion: "", ciudad: "", pais: "", codigo_postal: "" };

export default function AdminUbicacion() {
  const [form, setForm] = useState(VACIO);
  const [guardado, setGuardado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (data.length > 0) setGuardado(data[0]);
    } catch {
      setStatus({ tipo: "error", msg: "No se pudo cargar la ubicación." });
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async () => {
    if (!form.direccion.trim()) {
      setStatus({ tipo: "error", msg: "La dirección es requerida" });
      return;
    }
    setStatus(null);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: 1, ...form }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setForm(VACIO);
      setEditando(false);
      setStatus({ tipo: "ok", msg: "Ubicación guardada correctamente" });
      cargar();
    } catch (err) {
      setStatus({ tipo: "error", msg: err.message });
    }
  };

  const handleEditar = () => {
    setForm({
      direccion: guardado.direccion || "",
      ciudad: guardado.ciudad || "",
      pais: guardado.pais || "",
      codigo_postal: guardado.codigo_postal || "",
    });
    setEditando(true);
    setStatus(null);
  };

  const handleCancelar = () => {
    setForm(VACIO);
    setEditando(false);
    setStatus(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">📍</div>
        <h2>Ubicación</h2>
      </div>

      {status && <p className={`empresa-status ${status.tipo}`}>{status.msg}</p>}

      <div className="empresa-add-row">
        <input className="empresa-input" name="direccion" placeholder="Dirección" value={form.direccion} onChange={handleChange} />
        <input className="empresa-input" name="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={handleChange} />
        <input className="empresa-input" name="pais" placeholder="País" value={form.pais} onChange={handleChange} />
        <input className="empresa-input" name="codigo_postal" placeholder="Código Postal" value={form.codigo_postal} onChange={handleChange} style={{ maxWidth: "150px" }} />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn-guardar" onClick={guardar}>
          {editando ? "Actualizar" : "Guardar"}
        </button>
        {editando && (
          <button className="btn-guardar" onClick={handleCancelar}
            style={{ background: "var(--surface2)", boxShadow: "none" }}>
            Cancelar
          </button>
        )}
      </div>

      {guardado && (
        <div className="empresa-item-list" style={{ marginTop: "16px" }}>
          <div className="empresa-item">
            <div className="empresa-item-text">
              <strong>{guardado.direccion}</strong>
              <div className="empresa-item-sub">
                {[guardado.ciudad, guardado.pais, guardado.codigo_postal].filter(Boolean).join(", ")}
              </div>
            </div>
            <button className="btn-agregar" onClick={handleEditar}>Editar</button>
          </div>
        </div>
      )}
    </div>
  );
}