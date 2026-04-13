import { useEffect, useState } from "react";
import "../../styles/Admin/AdminMarcas.css";

function AdminMarcas() {
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const API = `${API_URL}/api/admin/marcas`;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }

    setError(null);
    try {
      const url = editando ? `${API}/${idEditar}` : API;
      const method = editando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });

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

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta marca?")) return;

    setError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      obtenerMarcas();
    } catch (error) {
      console.error("Error al eliminar:", error);
      setError("No se pudo eliminar la marca.");
    }
  };

  const handleEditar = (marca) => {
    setNombre(marca.nombre);
    setEditando(true);
    setIdEditar(marca.id); // ✅ PostgreSQL usa "id"
    setError(null);
  };

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
        <button type="submit">{editando ? "Actualizar" : "Agregar"}</button>
        {editando && (
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
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
              <tr key={marca.id}>
                <td>{marca.id}</td>
                <td>{marca.nombre}</td>
                <td><button type="button" className="btn-editar" onClick={() => handleEditar(marca)}>Editar</button><button type="button" className="btn-eliminar" onClick={() => handleEliminar(marca.id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminMarcas;