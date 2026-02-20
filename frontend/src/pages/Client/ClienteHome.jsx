import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ClienteHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(storedUser);
    // Si es administrador no debe estar aquí
    if (parsed.rol === "administrador") {
      navigate("/admin/dashboard");
      return;
    }
    setUser(parsed);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div style={{ fontFamily: "Arial", padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1>Bienvenido, {user.nombre} 👋</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 20px", background: "#ef4444", color: "white",
            border: "none", borderRadius: "6px", cursor: "pointer"
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{ background: "#f9fafb", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
        <p><strong>Correo:</strong> {user.correo_electronico}</p>
        <p><strong>Rol:</strong> {user.rol}</p>
      </div>
    </div>
  );
}

export default ClienteHome;