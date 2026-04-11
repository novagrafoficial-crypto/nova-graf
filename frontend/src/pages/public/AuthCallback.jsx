import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const dataParam = searchParams.get("data");
    const error = searchParams.get("error");

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (dataParam) {
      try {
        const { user, token } = JSON.parse(decodeURIComponent(dataParam));
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);   // ← GUARDAR TOKEN

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