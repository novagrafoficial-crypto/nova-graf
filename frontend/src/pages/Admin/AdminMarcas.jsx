import { useEffect, useState } from "react";
import "../../styles/Admin/AdminMarcas.css";

function AdminMarcas() {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = "http://localhost:5000/api/admin/marcas";

  // Obtener marcas
  const obtenerMarcas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error en la respuesta del servidor");
      const data = await res.json();
      setMarcas(data);
    } catch (error) {
      console.error("Error al obtener marcas:", error);
      setError("No se pudieron cargar las marcas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerMarcas();
  }, []);

  // Agregar o actualizar
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setError(null);
    try {
      let res;
      if (editando) {
        // UPDATE
        res = await fetch(`${API}/${idEditar}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      } else {
        // CREATE
        res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre }),
        });
      }
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al guardar");
      }

      setNombre("");
      setEditando(false);
      setIdEditar(null);
      obtenerMarcas();
    } catch (error) {
      console.error("Error al guardar marca:", error);
      setError(error.message);
    }
  };

  // Eliminar
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta marca?")) return;

    setError(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      obtenerMarcas();
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError("No se pudo eliminar la marca.");
    }
  };

  // Editar
  const handleEditar = (marca) => {
    setNombre(marca.nombre);
    setEditando(true);
    setIdEditar(marca._id);  // Corregido: _id
    setError(null);
  };

  // Cancelar edición
  const handleCancelar = () => {
    setNombre("");
    setEditando(false);
    setIdEditar(null);
    setError(null);
  };

  return (
    <div className="admin-marcas-container">
      <h2>Administrar Marcas</h2>

      {error && <p className="error-message">{error}</p>}

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

      {loading ? (
        <p>Cargando marcas...</p>
      ) : (
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
              <tr key={marca._id}>  {/* Corregido: _id */}
                <td>{marca._id}</td>  {/* Corregido: _id (se muestra como string) */}
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
                    onClick={() => handleEliminar(marca._id)} 
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminMarcas;