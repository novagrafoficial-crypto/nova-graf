import React, { useState } from "react";
import "../../styles/public/Register.css";
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Funciones de validación
const validateName = (value) => /^[A-Za-záéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(value.trim());
const validateUsername = (value) => /^[A-Za-z0-9_]+$/.test(value.trim());
const validatePhone = (value) => /^\d{7,15}$/.test(value.trim());
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (pwd) => pwd.length >= 6;

function Register() {
  const [form, setForm] = useState({
    name: "", lastNameP: "", lastNameM: "", username: "", birthDate: "",
    address: "", phone: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Validar en tiempo real (opcional)
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "name":
      case "lastNameP":
      case "lastNameM":
        if (!value.trim()) error = "Campo obligatorio";
        else if (!validateName(value)) error = "Solo letras y espacios";
        break;
      case "username":
        if (!value.trim()) error = "Campo obligatorio";
        else if (!validateUsername(value)) error = "Solo letras, números y _";
        break;
      case "birthDate":
        if (!value) error = "Campo obligatorio";
        break;
      case "phone":
        if (!value.trim()) error = "Campo obligatorio";
        else if (!validatePhone(value)) error = "Debe tener entre 7 y 15 dígitos";
        break;
      case "email":
        if (!value.trim()) error = "Campo obligatorio";
        else if (!validateEmail(value)) error = "Correo inválido";
        break;
      case "password":
        if (!value) error = "Campo obligatorio";
        else if (!validatePassword(value)) error = "Mínimo 6 caracteres";
        else if (form.confirmPassword && value !== form.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: "" }));
        }
        break;
      case "confirmPassword":
        if (!value) error = "Campo obligatorio";
        else if (value !== form.password) error = "Las contraseñas no coinciden";
        break;
      default: break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };

  const validateStep1 = () => {
    const fields = ["name", "lastNameP", "lastNameM", "username", "birthDate"];
    let valid = true;
    fields.forEach(field => {
      if (!validateField(field, form[field])) valid = false;
    });
    if (!valid) setMessage("Corrige los errores antes de continuar.");
    else setMessage("");
    return valid;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setMessage("");
  };

  const validateStep2 = () => {
    const fields = ["address", "phone", "email", "password", "confirmPassword"];
    let valid = true;
    fields.forEach(field => {
      if (!validateField(field, form[field])) valid = false;
    });
    if (!valid) setMessage("Corrige los errores antes de registrarte.");
    else setMessage("");
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
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
          <p className="register-subtitle">
            {step === 1 ? "Completa tus datos personales" : "Datos de contacto y seguridad"}
          </p>

          <div className="step-indicator">
            <div className={`step-dot ${step === 1 ? "active" : ""}`}></div>
            <div className={`step-dot ${step === 2 ? "active" : ""}`}></div>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {step === 1 && (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={() => validateField("name", form.name)}
                    required
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="lastNameP"
                    placeholder="Apellido paterno"
                    value={form.lastNameP}
                    onChange={handleChange}
                    onBlur={() => validateField("lastNameP", form.lastNameP)}
                    required
                  />
                  {errors.lastNameP && <span className="field-error">{errors.lastNameP}</span>}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="lastNameM"
                    placeholder="Apellido materno"
                    value={form.lastNameM}
                    onChange={handleChange}
                    onBlur={() => validateField("lastNameM", form.lastNameM)}
                    required
                  />
                  {errors.lastNameM && <span className="field-error">{errors.lastNameM}</span>}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    name="username"
                    placeholder="Nombre de usuario"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={() => validateField("username", form.username)}
                    required
                  />
                  {errors.username && <span className="field-error">{errors.username}</span>}
                </div>
                <div className="input-group">
                  <input
                    type="date"
                    name="birthDate"
                    value={form.birthDate}
                    onChange={handleChange}
                    onBlur={() => validateField("birthDate", form.birthDate)}
                    required
                  />
                  {errors.birthDate && <span className="field-error">{errors.birthDate}</span>}
                </div>
                <button type="button" className="btn-next" onClick={handleNext}>
                  Siguiente
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    name="address"
                    placeholder="Domicilio"
                    value={form.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Teléfono"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={() => validateField("phone", form.phone)}
                    required
                  />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Correo electrónico"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={() => validateField("email", form.email)}
                    required
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
                <div className="password-field input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={() => validateField("password", form.password)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                  {errors.password && <span className="field-error">{errors.password}</span>}
                </div>
                <div className="password-field input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Repetir contraseña"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => validateField("confirmPassword", form.confirmPassword)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
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