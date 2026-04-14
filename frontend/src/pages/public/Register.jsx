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
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validateStep1 = () => {
    const required = ["name", "lastNameP", "lastNameM", "username", "birthDate"];
    const missing = required.filter(field => !form[field].trim());
    if (missing.length > 0) {
      setMessage("Por favor completa todos los campos antes de continuar.");
      return false;
    }
    setMessage("");
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setMessage("");
  };

  const validatePasswords = () => {
    if (form.password !== form.confirmPassword) {
      setMessage("Las contraseñas no coinciden");
      return false;
    }
    if (form.password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        navigate(`/verify-account/${data.id_usuario}`);
      } else {
        setMessage(data.message || "Error en el registro");
      }
    } catch {
      setMessage("Error de conexión");
    }
  };

  const handleGoogleLogin = () => window.location.href = `${API_URL}/api/auth/google`;
  const handleFacebookLogin = () => window.location.href = `${API_URL}/api/auth/facebook`;

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

            {step === 2 && (
              <>
                <input
                  type="text"
                  name="address"
                  placeholder="Domicilio"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Teléfono"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repetir contraseña"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <div className="step-buttons">
                  <button type="button" className="btn-back" onClick={handleBack}>
                    ← Volver
                  </button>
                  <button type="submit" className="btn-register step2-btn">
                    Registrarse
                  </button>
                </div>
              </>
            )}
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