import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import ClientHeader from "../components/client/ClientHeader";
import ClientFooter from "../components/client/ClientFooter";

function ClientLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // ProtectedRoute ya garantiza que exista un usuario cliente autenticado
    // antes de llegar aquí; solo lo leemos para mostrarlo en el header.
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  if (!user) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <ClientHeader user={user} />
      <main style={{ flex: 1, width: "100%", padding: 0 }}>
      <Outlet context={{ user }} />
      </main>
      <ClientFooter />
    </div>
  );
}

export default ClientLayout;