// Register.js
import React, { useState } from "react";
import "../../styles/public/Register.css";
import Footer from "../../components/Footer";
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({
    name: "", lastNameP: "", lastNameM: "", username: "", birthDate: "",
    address: "", phone: "", email: "", password: "", confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Dentro del componente:
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  if (form.password !== form.confirmPassword) {
    setMessage("Las contraseñas no coinciden");
    return;
  }
  try {
    const res = await fetch("http://localhost:5000/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      // Redirigir al formulario de activación con el id_usuario
      navigate(`/verify-account/${data.id_usuario}`);
    } else {
      setMessage(data.message || "Error en el registro");
    }
  } catch {
    setMessage("Error de conexión");
  }
};
  const handleGoogleLogin = () => window.location.href = "http://localhost:5000/api/auth/google";
  const handleFacebookLogin = () => window.location.href = "http://localhost:5000/api/auth/facebook";

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <h1>Crear Cuenta</h1>
          <p className="register-subtitle">Completa tus datos para registrarte</p>

          <form onSubmit={handleSubmit} className="register-form">
            <input type="text" name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
            <input type="text" name="lastNameP" placeholder="Apellido paterno" value={form.lastNameP} onChange={handleChange} required />
            <input type="text" name="lastNameM" placeholder="Apellido materno" value={form.lastNameM} onChange={handleChange} required />
            <input type="text" name="username" placeholder="Nombre de usuario" value={form.username} onChange={handleChange} required />
            <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} required />
            <input type="text" name="address" placeholder="Domicilio" value={form.address} onChange={handleChange} required />
            <input type="text" name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
            <input type="password" name="confirmPassword" placeholder="Repetir contraseña" value={form.confirmPassword} onChange={handleChange} required />

            <button type="submit" className="btn-register">Registrarse</button>
          </form>

          {message && <p className="message">{message}</p>}

          <div className="social-login">
            <p className="social-title">O regístrate con</p>
            <div className="social-buttons">
              <button className="social-btn google" onClick={handleGoogleLogin}>
                <i className="fab fa-google"></i> Google
              </button>
              <button className="social-btn facebook" onClick={handleFacebookLogin}>
                <i className="fab fa-facebook-f"></i> Facebook
              </button>
            </div>
          </div>

          <p className="login-link">
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </p>
          <p className="required-note">Todos los campos son obligatorios</p>
        </div>
      </div>
    </div>
  );
}

export default Register;