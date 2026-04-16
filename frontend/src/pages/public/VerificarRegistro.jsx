import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/public/VerificarRegistro.css";   // ← Importa el CSS

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
      const res = await fetch("http://localhost:5000/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: id_usuario, // ← string, sin Number()
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

  // ← Nuevo: reenviar código
const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/users/resend-activation-otp", { // ← solo cambia esto
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
    <div className="verificar-page">          {/* ← clase para separar del header */}
      <div className="verificar-card">
        <h2>Verifica tu cuenta</h2>
        <p>Ingresa el código de 6 dígitos que enviamos a tu correo.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            required
            disabled={loading}
            className="otp-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-verify"
          >
            {loading ? "Verificando..." : "Verificar cuenta"}
          </button>
        </form>

        {message && (
          <p className={`message ${success ? "success" : "error"}`}>
            {message}
          </p>
        )}

        {/* ← Botón reenviar código */}
        {!success && (
          <div className="resend-section">
            <p>¿No recibiste el código o expiró?</p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-resend"
            >
              {resending ? "Reenviando..." : "Reenviar código"}
            </button>
            {resendMessage && (
              <p className={`resend-message ${resendMessage.startsWith("✅") ? "success" : "error"}`}>
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