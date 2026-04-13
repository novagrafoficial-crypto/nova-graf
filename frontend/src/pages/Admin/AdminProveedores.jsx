import { useEffect, useState } from "react";


const API_URL = import.meta.env.VITE_API_URL;

const API = `${API_URL}/api/admin/Provedores`;

export default function AdminProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [activo, setActivo] = useState(true);

  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      const res = await fetch(API);
      setProveedores(await res.json());
    } catch {
      setError("No se pudieron cargar los proveedores.");
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      setError("El nombre del proveedor es requerido");
      return;
    }

    setError(null);

    try {
      const url = editandoId ? `${API}/${editandoId}` : API;
      const method = editandoId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_proveedor: nombre,
          contacto_nombre: contacto,
          telefono,
          correo_electronico: correo,
          direccion,
          activo
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }

      limpiar();
      cargar();

    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditar = (p) => {
    setNombre(p.nombre_proveedor);
    setContacto(p.contacto_nombre || "");
    setTelefono(p.telefono || "");
    setCorreo(p.correo_electronico || "");
    setDireccion(p.direccion || "");
    setActivo(p.activo);
    setEditandoId(p.proveedor_id);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este proveedor?")) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const limpiar = () => {
    setNombre("");
    setContacto("");
    setTelefono("");
    setCorreo("");
    setDireccion("");
    setActivo(true);
    setEditandoId(null);
    setError(null);
  };

  return (
    <div className="empresa-section">
      <div className="empresa-section-header">
        <div className="empresa-section-icon">🏢</div>
        <h2>Proveedores</h2>
      </div>

      {error && <p className="empresa-status error">{error}</p>}

      {/* FORMULARIO */}
      <div className="empresa-add-row">
        <input
          className="empresa-input"
          placeholder="Nombre del proveedor"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          className="empresa-input"
          placeholder="Nombre de contacto"
          value={contacto}
          onChange={(e) => setContacto(e.target.value)}
        />

        <input
          className="empresa-input"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <input
          className="empresa-input"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        <input
          className="empresa-input"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
        />

        <select
          className="empresa-input"
          value={activo}
          onChange={(e) => setActivo(e.target.value === "true")}
        >
          <option value={true}>Activo</option>
          <option value={false}>Inactivo</option>
        </select>

        <button className="btn-agregar" onClick={guardar}>
          {editandoId ? "Actualizar" : "Agregar"}
        </button>

        {editandoId && (
          <button
            className="btn-agregar"
            onClick={limpiar}
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)"
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* LISTA */}
      <div className="empresa-item-list">
        {proveedores.map((p) => (
          <div key={p.proveedor_id} className="empresa-item">
            <div className="empresa-item-text">
              <strong>{p.nombre_proveedor}</strong>
              <div className="empresa-item-sub">
                {p.contacto_nombre} | {p.telefono}
              </div>
              <div className="empresa-item-sub">
                {p.correo_electronico}
              </div>
              <div className="empresa-item-sub">
                {p.direccion}
              </div>
              <div className="empresa-item-sub">
                Estado: {p.activo ? "Activo" : "Inactivo"}
              </div>
            </div>

            <button className="btn-agregar" onClick={() => handleEditar(p)}>
              Editar
            </button>

            <button
              className="btn-eliminar-item"
              onClick={() => handleEliminar(p.proveedor_id)}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}