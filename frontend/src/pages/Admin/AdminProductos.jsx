import { useEffect, useState } from "react";
import "../../styles/Admin/AdminProductos.css";

function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [subcategoriaId, setSubcategoriaId] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [caracteristicasTexto, setCaracteristicasTexto] = useState("");
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [imagenActual, setImagenActual] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditar, setIdEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API = "http://localhost:5000/api/admin/productos";
  const API_CATS = "http://localhost:5000/api/admin/categorias";
  const API_SUBCATS = "http://localhost:5000/api/admin/subcategorias";
  const API_MARCAS = "http://localhost:5000/api/admin/marcas";

  // Cargar productos
  const obtenerProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos. Verifica el backend.");
    } finally {
      setLoading(false);
    }
  };

  // Cargar categorías
  const obtenerCategorias = async () => {
    setError(null);
    try {
      const res = await fetch(API_CATS);
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setError("No se pudieron cargar las categorías. Verifica el backend.");
    }
  };

  // Cargar subcategorías
  const obtenerSubcategorias = async () => {
    setError(null);
    try {
      const res = await fetch(API_SUBCATS);
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setSubcategorias(data);
    } catch (err) {
      console.error("Error al obtener subcategorías:", err);
      setError("No se pudieron cargar las subcategorías. Verifica el backend.");
    }
  };

  // Cargar marcas
  const obtenerMarcas = async () => {
    setError(null);
    try {
      const res = await fetch(API_MARCAS);
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json();
      setMarcas(data);
    } catch (err) {
      console.error("Error al obtener marcas:", err);
      setError("No se pudieron cargar las marcas. Verifica el backend.");
    }
  };

  useEffect(() => {
    obtenerProductos();
    obtenerCategorias();
    obtenerSubcategorias();
    obtenerMarcas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !precio || !categoriaId) {
      setError("Nombre, precio y categoría son requeridos");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("descripcion", descripcion);
    formData.append("precio", precio);
    formData.append("stock", stock);
    formData.append("categoria_id", categoriaId);
    formData.append("subcategoria_id", subcategoriaId);
    formData.append("marca_id", marcaId);
    formData.append("caracteristicas", caracteristicasTexto);  // Texto simple, backend parsea
    if (archivoImagen) formData.append("archivo_imagen", archivoImagen);
    if (editando) formData.append("archivo_imagen_actual", imagenActual);

    setError(null);
    try {
      const method = editando ? "PUT" : "POST";
      const url = editando ? `${API}/${idEditar}` : API;
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al guardar");
      }

      setNombre("");
      setDescripcion("");
      setPrecio("");
      setStock("");
      setCategoriaId("");
      setSubcategoriaId("");
      setMarcaId("");
      setCaracteristicasTexto("");
      setArchivoImagen(null);
      setImagenActual("");
      setEditando(false);
      setIdEditar(null);
      obtenerProductos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEliminar = async (id, imagen) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;

    setError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      obtenerProductos();
    } catch (err) {
      setError("No se pudo eliminar el producto.");
    }
  };

  const handleEditar = (prod) => {
    setNombre(prod.nombre);
    setDescripcion(prod.descripcion || "");
    setPrecio(prod.precio);
    setStock(prod.stock || "");
    setCategoriaId(prod.categoria_id);
    setSubcategoriaId(prod.subcategoria_id || "");
    setMarcaId(prod.marca_id || "");
    
    // Convertir objeto a texto simple
    let texto = "";
    for (const [clave, valor] of Object.entries(prod.caracteristicas || {})) {
      texto += `${clave}: ${valor}\n`;
    }
    setCaracteristicasTexto(texto.trim());

    setImagenActual(prod.archivo_imagen || "");
    setEditando(true);
    setIdEditar(prod.id);
    setError(null);
  };

  const handleCancelar = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setCategoriaId("");
    setSubcategoriaId("");
    setMarcaId("");
    setCaracteristicasTexto("");
    setArchivoImagen(null);
    setImagenActual("");
    setEditando(false);
    setIdEditar(null);
    setError(null);
  };

  return (
    <div className="admin-productos-container">
      <h2>Administrar Productos</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="form-productos">
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />

        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />

        <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Selecciona categoría</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <select value={subcategoriaId} onChange={(e) => setSubcategoriaId(e.target.value)}>
          <option value="">Selecciona subcategoría</option>
          {subcategorias.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.nombre}
            </option>
          ))}
        </select>

        <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
          <option value="">Selecciona marca</option>
          {marcas.map((marca) => (
            <option key={marca.id} value={marca.id}>
              {marca.nombre}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Características (una por línea, ej: tallas: S, M, L \n color: rojo, azul \n material: algodón)"
          value={caracteristicasTexto}
          onChange={(e) => setCaracteristicasTexto(e.target.value)}
          rows={5}
        />

        <input type="file" onChange={(e) => setArchivoImagen(e.target.files[0])} />
        {imagenActual && <img src={imagenActual} alt="Imagen actual" style={{ width: "100px" }} />}

        <button type="submit">{editando ? "Actualizar" : "Agregar"}</button>

        {editando && (
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
        )}
      </form>

      {loading ? (
        <p>Cargando productos...</p>
      ) : (
        <table className="tabla-productos">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th>Marca</th>
              <th>Características</th>
              <th>Imagen</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>{prod.nombre}</td>
                <td>{prod.precio}</td>
                <td>{prod.stock}</td>
                <td>{prod.categoria_nombre}</td>
                <td>{prod.subcategoria_nombre}</td>
                <td>{prod.marca_nombre}</td>
                <td>
                  <ul>
                    {Object.entries(prod.caracteristicas || {}).map(([clave, valor]) => (
                      <li key={clave}>
                        <strong>{clave}:</strong> {valor}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>
                  {prod.archivo_imagen && <img src={prod.archivo_imagen} alt="" style={{ width: '50px' }} />}
                </td>
                <td>
                  <button className="btn-editar" onClick={() => handleEditar(prod)}>
                    Editar
                  </button>
                  <button className="btn-eliminar" onClick={() => handleEliminar(prod.id, prod.archivo_imagen)}>
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

export default AdminProductos;