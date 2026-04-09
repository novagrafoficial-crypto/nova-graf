import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

function ResetPassword() {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ 1. Definimos la URL usando la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      // ✅ 2. Reemplazamos localhost por la variable dinámica
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage("¡Contraseña actualizada! Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(data.message || "Error al actualizar");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          <h2 style={{ fontFamily: "Arial", marginBottom: "8px", color: "#1e293b" }}>
            Nueva contraseña
          </h2>
          <p style={{ color: "#64748b", marginBottom: "28px", fontFamily: "Arial" }}>
            Escribe tu nueva contraseña.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nueva contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>

          {message && (
            <p style={{ marginTop: "16px", textAlign: "center", fontFamily: "Arial", color: success ? "#16a34a" : "#ef4444" }}>
              {message}
            </p>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
}

const labelStyle = { display: "block", fontFamily: "Arial", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontFamily: "Arial", fontSize: "0.95rem", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontFamily: "Arial", fontSize: "1rem", cursor: "pointer" };

export default ResetPassword;