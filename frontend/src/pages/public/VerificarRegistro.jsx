import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function VerificarRegistro() {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: id_usuario,
          otp: String(otp)
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage("¡Cuenta activada exitosamente! Redirigiendo...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(data.message || "Código incorrecto");
      }
    } catch (error) {
      setMessage("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/resend-activation-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario }),
      });
      const data = await res.json();

      if (res.ok) {
        setResendMessage("✅ Código reenviado. Revisa tu correo.");
      } else {
        setResendMessage("❌ " + (data.message || "No se pudo reenviar"));
      }
    } catch {
      setResendMessage("❌ Error de conexión");
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: "70vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: "40px 16px", background: "#f8fafc"
    }}>
      <div style={{
        background: "white", borderRadius: "16px", padding: "40px",
        width: "100%", maxWidth: "420px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        textAlign: "center", fontFamily: "Arial"
      }}>
        <h2 style={{ marginBottom: "8px", color: "#1e293b" }}>Verifica tu cuenta</h2>
        <p style={{ color: "#64748b", marginBottom: "28px" }}>
          Ingresa el código de 6 dígitos que enviamos a tu correo.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            disabled={loading}
            style={{
              padding: "14px", fontSize: "1.8rem", letterSpacing: "10px",
              textAlign: "center", width: "100%", marginBottom: "16px",
              border: "2px solid #e2e8f0", borderRadius: "10px",
              boxSizing: "border-box", outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: loading ? "#94a3b8" : "#4f46e5",
              color: "white", border: "none", borderRadius: "8px",
              fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Verificando..." : "Verificar cuenta"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "16px", color: success ? "#16a34a" : "#ef4444", fontWeight: "500" }}>
            {message}
          </p>
        )}

        {!success && (
          <div style={{ marginTop: "20px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "8px" }}>
              ¿No recibiste el código o expiró?
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "transparent", border: "none",
                color: resending ? "#94a3b8" : "#4f46e5",
                cursor: resending ? "not-allowed" : "pointer",
                fontSize: "0.9rem", fontWeight: "600", textDecoration: "underline"
              }}
            >
              {resending ? "Reenviando..." : "Reenviar código"}
            </button>

            {resendMessage && (
              <p style={{
                marginTop: "8px", fontSize: "0.85rem",
                color: resendMessage.startsWith("✅") ? "#16a34a" : "#ef4444"
              }}>
                {resendMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerificarRegistro;