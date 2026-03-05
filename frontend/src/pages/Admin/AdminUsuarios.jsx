import { useEffect, useState } from "react";
import "../../styles/admin/AdminUsuarios.css";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const API = "http://localhost:5000/api/admin/usuarios";

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const obtenerUsuarios = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setUsuarios(data);
  };

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol =
      rolActual === "administrador" ? "cliente" : "administrador";

    await fetch(`${API}/${id}/rol`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rol: nuevoRol }),
    });

    obtenerUsuarios();
  };

  const cambiarEstado = async (id, estadoActual) => {
    await fetch(`${API}/${id}/activo`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !estadoActual }),
    });

    obtenerUsuarios();
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">Gestión de Usuarios</h2>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id_usuario}>
                <td>{u.id_usuario}</td>
                <td>
                  {u.nombre} {u.apellido_paterno}
                </td>
                <td>{u.nombre_usuario}</td>
                <td>{u.correo_electronico}</td>
                <td>
                  <span
                    className={
                      u.rol === "administrador"
                        ? "badge-admin"
                        : "badge-user"
                    }
                  >
                    {u.rol}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      u.activo ? "badge-active" : "badge-inactive"
                    }
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn-role"
                    onClick={() => cambiarRol(u.id_usuario, u.rol)}
                  >
                    Cambiar Rol
                  </button>

                  <button
                    className="btn-status"
                    onClick={() =>
                      cambiarEstado(u.id_usuario, u.activo)
                    }
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsuarios;