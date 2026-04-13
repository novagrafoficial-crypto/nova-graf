import { useEffect, useState } from "react";
import "../../styles/admin/adminCategorias.css";

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const API = "http://localhost:5000/api/admin/categorias";

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error en la respuesta");
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
      const url = editando ? `${API}/${idEditar}` : API;
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Error al guardar");
        return;
      }

      setNombre("");
      setEditando(false);
      setIdEditar(null);
      obtenerCategorias();
    } catch (err) {
      console.error("Error:", err);
      alert("Ocurrió un error inesperado");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar");
      obtenerCategorias();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setEditando(true);
    setIdEditar(cat.id); // ✅ PostgreSQL usa "id", no "_id"
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
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id}> {/* ✅ */}
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
                  onClick={() => handleEliminar(cat.id)} // ✅
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