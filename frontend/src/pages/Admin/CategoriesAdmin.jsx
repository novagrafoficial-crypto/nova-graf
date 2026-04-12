import { useEffect, useState } from "react";

function CategoriesAdmin() {
  const [nombre, setNombre] = useState("");
  const [categories, setCategories] = useState([]);

  // ✅ URL dinámica con fallback para desarrollo local
  const API_BASE = import.meta.env.VITE_API_URL;
  const API = `${API_BASE}/api/admin/categorias`;

  // Obtener categorías
  const loadCategories = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Crear categoría
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      setNombre("");
      loadCategories();
    } catch (error) {
      console.error("Error al guardar categoría:", error);
    }
  };

  return (
    <div>
      <h1>Gestión de Categorías</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre categoría"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="submit">Guardar</button>
      </form>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id}>{cat.nombre}</li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesAdmin;