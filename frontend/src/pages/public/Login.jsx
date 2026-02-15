import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";

function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:3000/api/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.status === 200) {
      navigate("/");
    }
  };

    return (
    <div className="login-container">
        <div className="login-card">

        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>

            <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            />

            <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            />

            <button type="submit">Ingresar</button>

        </form>

        <p className="login-message">{message}</p>

        </div>
    </div>
    );

}

export default Login;
