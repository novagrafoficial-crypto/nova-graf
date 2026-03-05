import { useEffect, useState } from "react";
import "../../styles/Admin/AdminSubcategorias.css";

function AdminSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = "http://localhost:5000/api/admin/subcategorias";
  const API_CATS = "http://localhost:5000/api/admin/categorias";

  // Cargar subcategorías
  const obtenerSubcategorias = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();
      setSubcategorias(data);
    } catch (err) {
      console.error("Error al obtener subcategorías:", err);
      setError("No se pudieron cargar las subcategorías. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías para dropdown
  const obtenerCategorias = async () => {
    try {
      const res = await fetch(API_CATS);
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setError("No se pudieron cargar las categorías.");
    }
  };

  useEffect(() => {
    obtenerSubcategorias();
    obtenerCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !categoriaId) {
      setError("El nombre y la categoría son requeridos");
      return;
    }

    setError(null);
    try {
      let res;
      if (editando) {
        res = await fetch(`${API}/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, categoria_id: categoriaId }),
        });
      } else {
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, categoria_id: categoriaId }),
        });
      }
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al guardar");
      }

      setNombre("");
      setCategoriaId("");
      setEditando(false);
      setIdEditar(null);
      obtenerSubcategorias();
    } catch (err) {
      console.error("Error al guardar subcategoría:", err);
      setError(err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta subcategoría?")) return;

    setError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      obtenerSubcategorias();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError("No se pudo eliminar la subcategoría.");
    }
  };

  const handleEditar = (sub) => {
    setNombre(sub.nombre);
    setCategoriaId(sub.categoria_id);
    setEditando(true);
    setIdEditar(sub.id);  // En el mapeo del model, 'id' es _id
    setError(null);
  };

  const handleCancelar = () => {
    setNombre("");
    setCategoriaId("");
    setEditando(false);
    setIdEditar(null);
    setError(null);
  };

  return (
    <div className="admin-subcategorias-container">
      <h2>Administrar Subcategorías</h2>

      {error && <p className="error-message">{error}</p>}

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
            <option key={cat._id} value={cat._id}>  {/* Asumiendo categorias usa _id */}
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

      {loading ? (
        <p>Cargando subcategorías...</p>
      ) : (
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
              <tr key={sub.id}>  {/* 'id' es _id mapeado */}
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
      )}
    </div>
  );
}

export default AdminSubcategorias;