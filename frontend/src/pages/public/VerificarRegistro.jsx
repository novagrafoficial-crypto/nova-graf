import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function VerificarRegistro() {
  const { id_usuario } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug — borrar después de que funcione
    console.log("id_usuario:", id_usuario);
    console.log("otp:", otp);

    try {
      const res = await fetch("http://localhost:5000/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id_usuario: Number(id_usuario), // Convertir a número
          otp: String(otp)               // Asegurar que sea string
        }),
      });
      const data = await res.json();

      console.log("Respuesta backend:", data); // Debug

      if (res.ok) {
        setSuccess(true);
        setMessage("¡Cuenta activada exitosamente! Redirigiendo...");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(data.message || "Código incorrecto");
      }
    } catch (error) {
      console.error("Error:", error); // Debug
      setMessage("Error de conexión");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center", fontFamily: "Arial" }}>
      <h2>Verifica tu cuenta</h2>
      <p>Ingresa el código de 6 dígitos que enviamos a tu correo.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Código OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
          style={{ padding: "10px", fontSize: "1.5rem", letterSpacing: "8px", textAlign: "center", width: "100%", marginBottom: "16px" }}
        />
        <button
          type="submit"
          style={{ width: "100%", padding: "12px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", fontSize: "1rem", cursor: "pointer" }}
        >
          Verificar cuenta
        </button>
      </form>

      {message && (
        <p style={{ marginTop: 16, color: success ? "green" : "red" }}>{message}</p>
      )}
    </div>
  );
}

export default VerificarRegistro;