import { useEffect, useState } from "react";
import "../../styles/admin/adminCategorias.css";

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
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

  const mostrarExito = (msg) => {
    setExito(msg);
    setTimeout(() => setExito(""), 3000);
  };

  const mostrarError = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      mostrarError("El nombre de la categoría es requerido");
      return;
    }

    // Verificar duplicado localmente (solo para nuevas categorías)
    if (!editando) {
      const existe = categorias.some(
        cat => cat.nombre.toLowerCase() === nombreTrim.toLowerCase()
      );
      
      if (existe) {
        mostrarError(`La categoría "${nombreTrim}" ya existe`);
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
        mostrarError(errorData.error || "Error al guardar");
        return;
      }

      // Resetear formulario
      setNombre("");
      setDescripcion("");
      setEditando(false);
      setIdEditar(null);
      
      // Recargar lista
      await obtenerCategorias();
      
      // Mensaje de éxito
      mostrarExito(editando ? "Categoría actualizada correctamente" : "Categoría agregada correctamente");
      
    } catch (err) {
      console.error("Error:", err);
      mostrarError("Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id, nombreCat) => {
    if (!window.confirm(`¿Seguro que quieres eliminar la categoría "${nombreCat}"?`)) return;

    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        mostrarError(error.error || "No se pudo eliminar");
        return;
      }
      await obtenerCategorias();
      mostrarExito("Categoría eliminada correctamente");
    } catch (err) {
      console.error(err);
      mostrarError("Error al eliminar");
    }
  };

  const handleEditar = (cat) => {
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || "");
    setEditando(true);
    setIdEditar(cat.id);
    setError("");
    setExito("");
  };

  const handleCancelar = () => {
    setNombre("");
    setDescripcion("");
    setEditando(false);
    setIdEditar(null);
    setError("");
    setExito("");
  };

  return (
    <div className="admin-categorias-container">
      <div className="admin-categorias-inner">
        <h2>Administrar Categorías</h2>

        {error && <div className="admin-error">{error}</div>}
        {exito && <div className="admin-success">{exito}</div>}

        <form onSubmit={handleSubmit} className="form-categorias">
          <input
            type="text"
            placeholder="Nombre de la categoría *"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError("");
            }}
          />
          
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

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
                    <td>#{cat.id}</td>
                    <td>
                      <span className="categorias-counter">{cat.nombre}</span>
                    </td>
                    <td>{cat.descripcion || "—"}</td>
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
                        onClick={() => handleEliminar(cat.id, cat.nombre)}
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
    </div>
  );
}

export default AdminCategorias;