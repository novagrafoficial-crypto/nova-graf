import { useState } from "react";
import "../styles/Register.css";

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

    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setMessage(data.message);
    } catch (error) {
      setMessage("Error de conexión con el servidor");
    }
  };

  return (
    <div className="register-container">
      <h1>Crear Cuenta</h1>

      <form onSubmit={handleSubmit} className="register-form">
        <input type="text" name="name" placeholder="Nombre" onChange={handleChange} />
        <input type="text" name="lastNameP" placeholder="Apellido paterno" onChange={handleChange} />
        <input type="text" name="lastNameM" placeholder="Apellido materno" onChange={handleChange} />
        <input type="text" name="username" placeholder="Nombre de usuario" onChange={handleChange} />
        <input type="date" name="birthDate" onChange={handleChange} />
        <input type="text" name="address" placeholder="Domicilio" onChange={handleChange} />
        <input type="text" name="phone" placeholder="Teléfono" onChange={handleChange} />
        <input type="email" name="email" placeholder="Correo electrónico" onChange={handleChange} />
        <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} />
        <input type="password" name="confirmPassword" placeholder="Repetir contraseña" onChange={handleChange} />

        <button type="submit">Registrar</button>
      </form>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Register;
