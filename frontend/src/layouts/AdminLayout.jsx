import { Outlet, Link } from "react-router-dom";
import "../styles/Admin/AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">
        <h2>Panel Admin</h2>

        <nav>
          <Link to="marcas">Marcas</Link>
          <Link to="categorias">Categorías</Link>
          <Link to="subcategorias">Subcategorías</Link>
          <Link to="productos">Productos</Link>
          <Link to="usuarios">Usuarios</Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;