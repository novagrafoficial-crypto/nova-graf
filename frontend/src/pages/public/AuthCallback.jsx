import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userParam = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("user", JSON.stringify(user));

        if (user.rol === "administrador") {
          navigate("/admin/dashboard");
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