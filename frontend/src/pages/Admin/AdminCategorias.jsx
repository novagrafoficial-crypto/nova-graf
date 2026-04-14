import { useEffect, useState } from "react";
import "../../styles/admin/adminCategorias.css";

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const API = "http://localhost:5000/api/admin/categorias";

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Error en la respuesta");
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setError("Error al cargar las categorías");
    }
  };

  useEffect(() => {
    obtenerCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      setError("El nombre de la categoría es requerido");
      return;
    }

    // Verificar duplicado localmente (solo para nuevas categorías)
    if (!editando) {
      const existe = categorias.some(
        cat => cat.nombre.toLowerCase() === nombreTrim.toLowerCase()
      );
      
      if (existe) {
        setError(`La categoría "${nombreTrim}" ya existe`);
        return;
      }
    }

    setCargando(true);

    try {
      const url = editando ? `${API}/${idEditar}` : API;
      const method = editando ? "PUT" : "POST";

      const body = {
        nombre: nombreTrim,
        descripcion: descripcion.trim() || null
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error al guardar");
        return;
      }

      // Resetear formulario
      setNombre("");
      setDescripcion("");
      setEditando(false);
      setIdEditar(null);
      setError("");
      
      // Recargar lista
      await obtenerCategorias();
      
      // Mensaje de éxito
      alert(editando ? "✅ Categoría actualizada" : "✅ Categoría agregada");
      
    } catch (err) {
      console.error("Error:", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "No se pudo eliminar");
        return;
      }
      await obtenerCategorias();
      alert("✅ Categoría eliminada");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || "");
    setEditando(true);
    setIdEditar(cat.id);
    setError("");
  };

  const handleCancelar = () => {
    setNombre("");
    setDescripcion("");
    setEditando(false);
    setIdEditar(null);
    setError("");
  };

  return (
    <div className="admin-categorias-container">
      <h2>Administrar Categorías</h2>

      <form onSubmit={handleSubmit} className="form-categorias">
        <div className="form-group">
          <input
            type="text"
            placeholder="Nombre de la categoría *"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError("");
            }}
            className={error ? "input-error" : ""}
          />
        </div>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        {error && <div className="error-mensaje">{error}</div>}
        
        <div className="form-buttons">
          <button type="submit" disabled={cargando}>
            {cargando ? "Guardando..." : (editando ? "Actualizar" : "Agregar")}
          </button>
          
          {editando && (
            <button 
              type="button" 
              className="btn-cancelar" 
              onClick={handleCancelar}
              disabled={cargando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="tabla-container">
        <table className="tabla-categorias">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan="4" className="sin-datos">
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              categorias.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.nombre}</td>
                  <td>{cat.descripcion || "-"}</td>
                  <td className="acciones">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminCategorias;