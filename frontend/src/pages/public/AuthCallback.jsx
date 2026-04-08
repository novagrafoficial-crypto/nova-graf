import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get("user");
    const token = searchParams.get("token");        // ← NUEVO
    const error = searchParams.get("error");

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (userParam && token) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        // ✅ GUARDAR TOKEN Y USUARIO
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (user.rol === "administrador") {
          navigate("/admin");
        } else {
          navigate("/cliente/home");
        }
      } catch {
        navigate("/login?error=invalid");
      }
    } else {
      navigate("/login");
    }
  }, [navigate, searchParams]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <p style={{ fontFamily: "Arial", color: "#64748b" }}>Iniciando sesión...</p>
    </div>
  );
}

export default AuthCallback;