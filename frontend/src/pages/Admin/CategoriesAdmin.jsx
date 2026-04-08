import { useEffect, useState } from "react";

function CategoriesAdmin(){

  const [nombre, setNombre] = useState("");
  const [categories, setCategories] = useState([]);

  // Obtener categorías
  const loadCategories = async () => {
    const res = await fetch("http://localhost:3000/api/catalog/categories");
    const data = await res.json();
    setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Crear categoría
  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:3000/api/catalog/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre })
    });

    setNombre("");
    loadCategories();
  };

  return(
    <div>

      <h1>Gestión de Categorías</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre categoría"
          value={nombre}
          onChange={(e)=>setNombre(e.target.value)}
        />

        <button>Guardar</button>
      </form>

      <ul>
        {categories.map(cat => (
          <li key={cat.id}>
            {cat.nombre}
          </li>
        ))}
      </ul>

    </div>
  )
}

export default CategoriesAdmin;