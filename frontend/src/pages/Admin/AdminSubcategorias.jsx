import { useEffect, useState } from "react";
import "../../styles/Admin/AdminSubcategorias.css";

function AdminSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const API = "http://localhost:5000/api/admin/subcategorias";
  const API_CATS = "http://localhost:5000/api/admin/categorias";

  // Cargar subcategorías
  const obtenerSubcategorias = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setSubcategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Cargar categorías para dropdown
  const obtenerCategorias = async () => {
    try {
      const res = await fetch(API_CATS);
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    obtenerSubcategorias();
    obtenerCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !categoriaId) return;

    try {
      if (editando) {
        await fetch(`${API}/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, categoria_id: categoriaId }),
        });
      } else {
        await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, categoria_id: categoriaId }),
        });
      }

      setNombre("");
      setCategoriaId("");
      setEditando(false);
      setIdEditar(null);
      obtenerSubcategorias();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await fetch(`${API}/${id}`, { method: "DELETE" });
      obtenerSubcategorias();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditar = (sub) => {
    setNombre(sub.nombre);
    setCategoriaId(sub.categoria_id);
    setEditando(true);
    setIdEditar(sub.id);
  };

  const handleCancelar = () => {
    setNombre("");
    setCategoriaId("");
    setEditando(false);
    setIdEditar(null);
  };

  return (
    <div className="admin-subcategorias-container">
      <h2>Administrar Subcategorías</h2>

      <form onSubmit={handleSubmit} className="form-subcategorias">
        <input
          type="text"
          placeholder="Nombre de la subcategoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Selecciona una categoría</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <button type="submit">{editando ? "Actualizar" : "Agregar"}</button>

        {editando && (
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        )}
      </form>

      <table className="tabla-subcategorias">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {subcategorias.map((sub) => (
            <tr key={sub.id}>
              <td>{sub.id}</td>
              <td>{sub.nombre}</td>
              <td>{sub.categoria_nombre}</td>
              <td>
                <button type="button" className="btn-editar" onClick={() => handleEditar(sub)}>Editar</button>
                <button type="button" className="btn-eliminar" onClick={() => handleEliminar(sub.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminSubcategorias;