import AdminMision from "./AdminMision";
import AdminVision from "./AdminVision";
import AdminValores from "./AdminValores";
import AdminPoliticas from "./AdminPoliticas";
import AdminAntecedentes from "./AdminAntecedentes";
import AdminContactos from "./AdminContactos";
import AdminRedes from "./AdminRedes";
import AdminUbicacion from "./AdminUbicacion";
import "../../styles/Admin/Adminempresa.css"

function AdminEmpresa() {
  return (
    <div className="admin-empresa-page">

      <div className="admin-empresa-header">
        <h1>Administración de Empresa</h1>
        <p>Gestiona la información pública de tu empresa</p>
      </div>

      <div className="admin-empresa-grid">

        {/* Columna izquierda */}
        <AdminMision />
        <AdminVision />

        {/* Fila completa */}
        <div className="span-full">
          <AdminValores />
        </div>

        <div className="span-full">
          <AdminPoliticas />
        </div>

        <div className="span-full">
          <AdminAntecedentes />
        </div>

        {/* Dos columnas */}
        <AdminContactos />
        <AdminRedes />

        {/* Fila completa */}
        <div className="span-full">
          <AdminUbicacion />
        </div>

      </div>
    </div>
  );
}

export default AdminEmpresa;