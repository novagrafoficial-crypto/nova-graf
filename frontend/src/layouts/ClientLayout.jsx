import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import ClientHeader from "../components/client/ClientHeader";
import ClientFooter from "../components/client/ClientFooter";

function ClientLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.rol === "administrador") {
      navigate("/admin/AdminLayout");
      return;
    }
    setUser(parsed);
  }, [navigate]);

  // No renderizar nada hasta tener el usuario
  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ClientHeader user={user} />
      <main style={{ flex: 1, padding: "32px 40px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <Outlet context={{ user }} />
      </main>
      <ClientFooter />
    </div>
  );
}

export default ClientLayout;