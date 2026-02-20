import { useEffect, useState } from "react";
import "../../styles/Admin/AdminMarcas.css";

function AdminMarcas() {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const API = "http://localhost:5000/api/admin/marcas";

  // Obtener marcas
  const obtenerMarcas = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setMarcas(data);
    } catch (error) {
      console.error("Error al obtener marcas:", error);
    }
  };

  useEffect(() => {
    obtenerMarcas();
  }, []);

  // Agregar o actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) return;

    try {
      if (editando) {
        // UPDATE
        await fetch(`${API}/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      } else {
        // CREATE
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      }

      setNombre("");
      setEditando(false);
      setIdEditar(null);
      obtenerMarcas();
    } catch (error) {
      console.error("Error al guardar marca:", error);
    }
  };

  // Eliminar
  const handleEliminar = async (id) => {
    try {
      await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      obtenerMarcas();
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // Editar
  const handleEditar = (marca) => {
    setNombre(marca.nombre);
    setEditando(true);
    setIdEditar(marca.id);
  };

  // Cancelar edición
  const handleCancelar = () => {
    setNombre("");
    setEditando(false);
    setIdEditar(null);
  };

  return (
    <div className="admin-marcas-container">
      <h2>Administrar Marcas</h2>

      <form onSubmit={handleSubmit} className="form-marcas">
        <input
          type="text"
          placeholder="Nombre de la marca"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <button type="submit">
          {editando ? "Actualizar" : "Agregar"}
        </button>

        {editando && (
          <button
            type="button"
            className="btn-cancelar"
            onClick={handleCancelar}
          >
            Cancelar
          </button>
        )}
      </form>

      <table className="tabla-marcas">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((marca) => (
            <tr key={marca.id}>
              <td>{marca.id}</td>
              <td>{marca.nombre}</td>
              <td>
                <button
                  type="button"
                  className="btn-editar"
                  onClick={() => handleEditar(marca)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="btn-eliminar"
                  onClick={() => handleEliminar(marca.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminMarcas;
