import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

function VerifyRecovery() {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [msgColor, setMsgColor] = useState("#ef4444");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // ✅ 1. Definimos la URL usando la variable de entorno
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // ✅ 2. Reemplazamos localhost por la variable dinámica
      const res = await fetch(`${API_URL}/api/users/verify-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario, otp }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        // Código correcto → ir a cambiar contraseña
        navigate(`/reset-password/${id_usuario}`);
      } else {
        setMsgColor("#ef4444");
        setMessage(data.message || "Código incorrecto");
      }
    } catch {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMessage("");
    try {
      // ✅ 3. Reemplazamos localhost en el reenvío de OTP de recuperación
      const res = await fetch(`${API_URL}/api/users/resend-recovery-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario }),
      });
      const data = await res.json();
      setMsgColor("#16a34a");
      setMessage(data.message || "Código reenviado");
      setOtp(""); // limpiar el input
    } catch {
      setMsgColor("#ef4444");
      setMessage("Error al reenviar");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          <h2 style={{ fontFamily: "Arial", marginBottom: "8px", color: "#1e293b" }}>
            Verifica tu código
          </h2>
          <p style={{ color: "#64748b", marginBottom: "28px", fontFamily: "Arial" }}>
            Ingresa el código de 6 dígitos que enviamos a tu correo.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Código OTP</label>
              <input
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ ...inputStyle, textAlign: "center", fontSize: "1.8rem", letterSpacing: "10px" }}
              />
            </div>

            <button type="submit" disabled={loading} style={btnStyle}>
              {loading ? "Verificando..." : "Verificar código"}
            </button>
          </form>

          {message && (
            <p style={{ marginTop: "16px", textAlign: "center", fontFamily: "Arial", color: msgColor }}>
              {message}
            </p>
          )}

          {/* Botón reenviar */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ color: "#64748b", fontFamily: "Arial", fontSize: "0.9rem", marginBottom: "8px" }}>
              ¿No recibiste el código o expiró?
            </p>
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", fontFamily: "Arial", fontSize: "0.95rem", textDecoration: "underline" }}
            >
              {resendLoading ? "Reenviando..." : "Reenviar código"}
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

const labelStyle = { display: "block", fontFamily: "Arial", fontSize: "0.85rem", color: "#475569", marginBottom: "6px" };
const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontFamily: "Arial", fontSize: "0.95rem", boxSizing: "border-box" };
const btnStyle = { width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", fontFamily: "Arial", fontSize: "1rem", cursor: "pointer" };

export default VerifyRecovery;