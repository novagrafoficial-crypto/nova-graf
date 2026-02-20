import { useEffect, useState } from "react";
import "../../styles/Admin/AdminCategorias.css";

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const API = "http://localhost:5000/api/admin/categorias";

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
    }
  };

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      if (editando) {
        await fetch(`${API}/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      } else {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      }

      setNombre("");
      setEditando(false);
      setIdEditar(null);
      obtenerCategorias();
    } catch (err) {
      console.error("Error al guardar categoría:", err);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      obtenerCategorias();
    } catch (err) {
      console.error("Error al eliminar categoría:", err);
    }
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setEditando(true);
    setIdEditar(cat.id);
  };

  const handleCancelar = () => {
    setNombre("");
    setEditando(false);
    setIdEditar(null);
  };

  return (
    <div className="admin-categorias-container">
      <h2>Administrar Categorías</h2>

      <form onSubmit={handleSubmit} className="form-categorias">
        <input
          type="text"
          placeholder="Nombre de la categoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="submit">{editando ? "Actualizar" : "Agregar"}</button>
        {editando && (
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        )}
      </form>

      <table className="tabla-categorias">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.id}</td>
              <td>{cat.nombre}</td>
              <td>
                <button
                  type="button"
                  className="btn-editar"
                  onClick={() => handleEditar(cat)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-eliminar"
                  onClick={() => handleEliminar(cat.id)}
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

export default AdminCategorias;