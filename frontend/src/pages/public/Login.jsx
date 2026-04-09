import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import "../../styles/public/Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cuentaInactiva, setCuentaInactiva] = useState(false);

  // ✅ EXTRAEMOS LA URL PARA EVITAR ERRORES DE SINTAXIS EN CADA FETCH
  const API_URL = import.meta.env.VITE_API_URL;

  const errorMessages = {
    email_local: 'Este correo ya está registrado manualmente. Usa tu contraseña para iniciar sesión.',
    google: 'Error al iniciar sesión con Google. Intenta de nuevo.',
    facebook: 'Error al iniciar sesión con Facebook. Intenta de nuevo.',
    email_google: 'Este correo fue registrado con Google. Usa el botón de Google.',
    email_facebook: 'Este correo fue registrado con Facebook. Usa el botón de Facebook.',
  };

  const urlError = searchParams.get('error');
  const [message, setMessage] = useState(
    urlError ? errorMessages[urlError] || 'Error de autenticación' : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    setCuentaInactiva(false);
    setResendMessage("");

    try {
      // ✅ USAMOS BACKTICKS (`) PARA QUE FUNCIONE LA VARIABLE
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.user.rol === "administrador") {
          navigate("/admin");
        } else {
          navigate("/cliente/home");
        }
      } else {
        setMessage(data.message || "Error al iniciar sesión");
        if (data.message?.includes("no activada")) {
          setCuentaInactiva(true);
        }
      }
    } catch (error) {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResendActivation = async () => {
    setResending(true);
    setResendMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/get-user-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.id_usuario) {
        setResendMessage("❌ No se encontró el usuario");
        return;
      }

      const resend = await fetch(`${API_URL}/api/users/resend-activation-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: data.id_usuario }),
      });
      const resendData = await resend.json();

      if (resend.ok) {
        setResendMessage("✅ Código enviado. Revisa tu correo.");
        setTimeout(() => navigate(`/verify-account/${data.id_usuario}`), 2000);
      } else {
        setResendMessage("❌ " + (resendData.message || "Error al reenviar"));
      }
    } catch {
      setResendMessage("❌ Error de conexión");
    } finally {
      setResending(false);
    }
  };

  // ✅ CORREGIDO TAMBIÉN EL LOGIN DE GOOGLE
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="login-page">
      {/* ... (resto del JSX se mantiene igual) ... */}
      <div className="login-container">
        <div className="login-card">
          <h2>Bienvenido</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          {/* ... resto de botones y enlaces ... */}
          <button onClick={handleGoogleLogin} className="google-btn">Google</button>
          <div className="login-footer">
             <Link to="/register">Regístrate</Link>
             <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;