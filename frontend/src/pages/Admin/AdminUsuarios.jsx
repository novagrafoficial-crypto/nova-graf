import { useEffect, useState } from "react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/usuarios`;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "administrador" ? "cliente" : "administrador";
    await fetch(`${API}/${id}/rol`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevoRol }),
    });
    cargar();
  };

  const cambiarEstado = async (id, estadoActual) => {
    await fetch(`${API}/${id}/activo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !estadoActual }),
    });
    cargar();
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo_electronico?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre_usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ padding: "1.5rem" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ color: "#1A6163", fontSize: "22px", fontWeight: 500, margin: 0 }}>Gestión de Usuarios</h1>
          <p style={{ color: "#999", fontSize: "14px", margin: "4px 0 0" }}>{usuarios.length} usuarios registrados</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, correo o usuario..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px", borderRadius: "10px",
          border: "1.5px solid #d4eeea", fontSize: "14px",
          marginBottom: "1rem", boxSizing: "border-box", outline: "none",
        }}
      />

      {loading ? (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>Cargando usuarios...</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #d4eeea", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1A6163" }}>
                {["ID", "Nombre", "Usuario", "Correo", "Rol", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#fff", fontWeight: 600, fontSize: "12px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#999" }}>No hay usuarios que mostrar</td></tr>
              ) : usuariosFiltrados.map((u, i) => (
                <tr key={u.id_usuario} style={{ background: i % 2 === 0 ? "#fff" : "#f9fefe", borderBottom: "1px solid #e0f0ee" }}>
                  <td style={{ padding: "12px 14px", color: "#999" }}>#{u.id_usuario}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 500 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: u.rol === "administrador" ? "#1A6163" : "#E1F5EE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: 700,
                        color: u.rol === "administrador" ? "#fff" : "#0F6E56",
                        flexShrink: 0
                      }}>
                        {u.nombre?.charAt(0).toUpperCase()}
                      </div>
                      {u.nombre} {u.apellido_paterno}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>{u.nombre_usuario || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#666" }}>{u.correo_electronico}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                      background: u.rol === "administrador" ? "#1A6163" : "#d0eaff",
                      color: u.rol === "administrador" ? "#fff" : "#0a4a7c",
                    }}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 600,
                      background: u.activo ? "#d4f5eb" : "#f0f0f0",
                      color: u.activo ? "#0F6E56" : "#666",
                    }}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => cambiarRol(u.id_usuario, u.rol)} style={{
                        padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #35BA99",
                        background: "#fff", color: "#1A6163", cursor: "pointer", fontSize: "11px", fontWeight: 600
                      }}>
                        {u.rol === "administrador" ? "→ Cliente" : "→ Admin"}
                      </button>
                      <button onClick={() => cambiarEstado(u.id_usuario, u.activo)} style={{
                        padding: "6px 12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600,
                        background: u.activo ? "#ffd6d6" : "#d4f5eb",
                        color: u.activo ? "#8b0000" : "#0F6E56",
                      }}>
                        {u.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}