import { useEffect, useState } from "react";
import "../../styles/Admin/AdminProductos.css";

function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [activo, setActivo] = useState(true);

  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);

  const API = "http://localhost:5000/api/admin/productos";
  const API_MARCAS = "http://localhost:5000/api/admin/marcas";
  const API_CATS = "http://localhost:5000/api/admin/categorias";
  const API_SUBCATS = "http://localhost:5000/api/admin/subcategorias";

  useEffect(() => {
    obtenerProductos();
    obtenerMarcas();
    obtenerCategorias();
    obtenerSubcategorias();
  }, []);

  const obtenerProductos = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setProductos(data);
  };

  const obtenerMarcas = async () => {
    const res = await fetch(API_MARCAS);
    const data = await res.json();
    setMarcas(data);
  };

  const obtenerCategorias = async () => {
    const res = await fetch(API_CATS);
    const data = await res.json();
    setCategorias(data);
  };

  const obtenerSubcategorias = async () => {
    const res = await fetch(API_SUBCATS);
    const data = await res.json();
    setSubcategorias(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre) return;

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("marca_id", marcaId);
    formData.append("categoria_id", categoriaId);
    formData.append("subcategoria_id", subcategoriaId);
    formData.append("activo", activo ? "true" : "false");
    if (archivoImagen) formData.append("archivo_imagen", archivoImagen);

    if (editando) {
      await fetch(`${API}/${idEditar}`, { method: "PUT", body: formData });
    } else {
      await fetch(API, { method: "POST", body: formData });
    }

    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setMarcaId("");
    setCategoriaId("");
    setSubcategoriaId("");
    setArchivoImagen(null);
    setActivo(true);
    setEditando(false);
    setIdEditar(null);

    obtenerProductos();
  };

  const handleEliminar = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    obtenerProductos();
  };

  const handleEditar = (p) => {
    setNombre(p.nombre);
    setDescripcion(p.descripcion);
    setPrecio(p.precio);
    setStock(p.stock);
    setMarcaId(p.marca_id);
    setCategoriaId(p.categoria_id);
    setSubcategoriaId(p.subcategoria_id);
    setActivo(p.activo);
    setIdEditar(p.id);
    setEditando(true);
  };

  const handleCancelar = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setMarcaId("");
    setCategoriaId("");
    setSubcategoriaId("");
    setArchivoImagen(null);
    setActivo(true);
    setEditando(false);
    setIdEditar(null);
  };

  return (
    <div className="admin-productos-container">
      <h2>Administrar Productos</h2>

      <form onSubmit={handleSubmit} className="form-productos">
        <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
        <input type="number" placeholder="Precio" value={precio} onChange={e => setPrecio(e.target.value)} />
        <input type="number" placeholder="Stock" value={stock} onChange={e => setStock(e.target.value)} />

        <select value={marcaId} onChange={e => setMarcaId(e.target.value)}>
          <option value="">Selecciona Marca</option>
          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>

        <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}>
          <option value="">Selecciona Categoría</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <select value={subcategoriaId} onChange={e => setSubcategoriaId(e.target.value)}>
          <option value="">Selecciona Subcategoría</option>
          {subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>

        <input type="file" onChange={e => setArchivoImagen(e.target.files[0])} />

        <label>
          <input type="checkbox" checked={activo} onChange={e => setActivo(e.target.checked)} /> Activo
        </label>

        <button type="submit">{editando ? "Actualizar" : "Agregar"}</button>
        {editando && <button type="button" onClick={handleCancelar}>Cancelar</button>}
      </form>

      <table className="tabla-productos">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Marca</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nombre}</td>
              <td>{p.precio}</td>
              <td>{p.stock}</td>
              <td>{p.marca_nombre}</td>
              <td>{p.categoria_nombre}</td>
              <td>{p.subcategoria_nombre}</td>
              <td>{p.activo ? "Sí" : "No"}</td>
              <td>
                <button onClick={() => handleEditar(p)}>Editar</button>
                <button onClick={() => handleEliminar(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminProductos;