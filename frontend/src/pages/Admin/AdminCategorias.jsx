import { useEffect, useState } from "react";
import "../../styles/admin/adminCategorias.css";
import ModalConfirm from "../../components/ModalConfirm";

function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [cargando, setCargando] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const API = "http://localhost:5000/api/admin/categorias";

  // 🔧 Función para obtener el ID del usuario logueado
  const getUsuarioId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id_usuario || user.id;
  };

  const obtenerCategorias = async () => {
    try {
      const usuarioId = getUsuarioId();
      
      const res = await fetch(API, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': usuarioId, // ← Enviar ID del usuario
        },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("No autorizado. Inicia sesión como administrador.");
          return;
        }
        throw new Error("Error en la respuesta");
      }
      
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
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

      const usuarioId = getUsuarioId();

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": usuarioId, // ← Enviar ID del usuario
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        mostrarError(errorData.error || "Error al guardar");
        return;
      }

      setNombre("");
      setDescripcion("");
      setEditando(false);
      setIdEditar(null);
      await obtenerCategorias();
      mostrarExito(editando ? "Categoría actualizada correctamente" : "Categoría agregada correctamente");
      
    } catch (err) {
      console.error("Error:", err);
      mostrarError("Ocurrió un error inesperado");
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarClick = (cat) => {
    setCategoriaAEliminar(cat);
    setModalOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!categoriaAEliminar) return;
    
    try {
      const usuarioId = getUsuarioId();
      
      const res = await fetch(`${API}/${categoriaAEliminar.id}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          'X-User-Id': usuarioId, // ← Enviar ID del usuario
        },
      });
      
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
    } finally {
      setModalOpen(false);
      setCategoriaAEliminar(null);
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
      <ModalConfirm
        isOpen={modalOpen}
        title="Eliminar categoría"
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoriaAEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={confirmarEliminar}
        onCancel={() => {
          setModalOpen(false);
          setCategoriaAEliminar(null);
        }}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

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
                    <td className="id-cell">#{cat.id}</td>
                    <td className="nombre-cell">{cat.nombre}</td>
                    <td className="descripcion-cell">{cat.descripcion || "—"}</td>
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
                        onClick={() => handleEliminarClick(cat)}
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