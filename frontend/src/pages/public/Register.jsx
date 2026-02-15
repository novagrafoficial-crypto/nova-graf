import { useState } from "react";
import "../../styles/Register.css";

function Register() {
  const [form, setForm] = useState({
    name: "",
    lastNameP: "",
    lastNameM: "",
    username: "",
    birthDate: "",
    address: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación para asegurarse de que las contraseñas coinciden
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
      setMessage(data.message || "Usuario registrado con éxito");
    } catch (error) {
      setMessage("Error de conexión con el servidor");
    }
  };

  return (
    <div className="register-container">
      <h1>Crear Cuenta</h1>

      <form onSubmit={handleSubmit} className="register-form">
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastNameP"
          placeholder="Apellido paterno"
          value={form.lastNameP}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastNameM"
          placeholder="Apellido materno"
          value={form.lastNameM}
          onChange={handleChange}
        />
        <input
          type="text"
          name="username"
          placeholder="Nombre de usuario"
          value={form.username}
          onChange={handleChange}
        />
        <input
          type="date"
          name="birthDate"
          value={form.birthDate}
          onChange={handleChange}
        />
        <input
          type="text"
          name="address"
          placeholder="Domicilio"
          value={form.address}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Teléfono"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Repetir contraseña"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit">Registrar</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Register;
