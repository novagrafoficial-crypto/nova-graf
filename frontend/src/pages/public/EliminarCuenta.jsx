import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/public/Legal.css";
import { CORREO_PRIVACIDAD } from "./politicaPrivacidad";

const API_URL = import.meta.env.VITE_API_URL;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Página que pide Google Play: cualquier persona puede solicitar que se borre su cuenta,
// aunque ya no tenga la app instalada.
function EliminarCuenta() {
  const [correo, setCorreo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setError("");
    const c = correo.trim().toLowerCase();
    if (!CORREO.test(c)) {
      setErrorCorreo("Escribe el correo con el que te registraste");
      return;
    }
    if (!confirmado) {
      setError("Marca la casilla para confirmar que quieres eliminar tu cuenta.");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/api/users/solicitar-eliminacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: c, motivo: motivo.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setEnviado(data.message || "Recibimos tu solicitud.");
      else setError(data.message || "No se pudo enviar la solicitud. Intenta más tarde.");
    } catch {
      setError("Error de conexión. Intenta más tarde.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="legal">
      <div className="legal-contenedor">
        <div className="legal-hero">
          <h1>Eliminar mi cuenta de Nova Graf Mobile</h1>
          <p>Solicita que eliminemos tu cuenta de la app Nova Graf Mobile y del sitio web de Nova Graf, junto con tus datos personales.</p>
        </div>

        {enviado ? (
          <div className="legal-card legal-exito">
            <div className="legal-exito-icono">✓</div>
            <h2>Solicitud enviada</h2>
            <p>{enviado}</p>
            <Link to="/" className="legal-enlace">Volver al inicio</Link>
          </div>
        ) : (
          <>
            <div className="legal-card">
              <h2>Cómo funciona</h2>
              <ol>
                <li>Escribe el correo con el que te registraste y envía la solicitud.</li>
                <li>Te escribiremos a ese correo para confirmar que eres tú.</li>
                <li>Eliminamos tus datos en un máximo de 30 días y te avisamos por correo.</li>
              </ol>
              <p className="legal-fecha">
                También puedes hacerlo desde la app: Perfil → Eliminar mi cuenta, o escribiendo a{" "}
                <a className="legal-enlace" href={`mailto:${CORREO_PRIVACIDAD}`}>{CORREO_PRIVACIDAD}</a>.
              </p>
              <h3>Se elimina</h3>
              <ul>
                <li>Nombre, apellidos, usuario y fecha de nacimiento.</li>
                <li>Teléfono, domicilio y correo.</li>
                <li>Identificador de Google y contraseña (ya no podrás iniciar sesión).</li>
              </ul>
              <h3>Se conserva</h3>
              <ul>
                <li>Pedidos, pagos, comprobantes, diseños y mensajes de tus pedidos, solo el tiempo que exigen las obligaciones fiscales y legales.</li>
              </ul>
            </div>

            <form className="legal-card legal-form" onSubmit={enviar} noValidate>
              {error && <div className="legal-mensaje error">{error}</div>}

              <div className={`legal-campo ${errorCorreo ? "error" : ""}`}>
                <label htmlFor="correo">Correo de tu cuenta</label>
                <input
                  id="correo"
                  type="email"
                  placeholder="nombre@correo.com"
                  value={correo}
                  onChange={(e) => {
                    setCorreo(e.target.value.replace(/\s/g, ""));
                    setErrorCorreo("");
                  }}
                />
                {errorCorreo && <span className="legal-error-campo">{errorCorreo}</span>}
              </div>

              <div className="legal-campo">
                <label htmlFor="motivo">
                  Motivo <span>(opcional)</span>
                </label>
                <textarea
                  id="motivo"
                  maxLength={500}
                  placeholder="Cuéntanos por qué te vas (nos ayuda a mejorar)"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
              </div>

              <label className="legal-check">
                <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
                Entiendo que mi cuenta y mis datos se eliminarán y no se podrán recuperar.
              </label>

              <button className="legal-boton" type="submit" disabled={enviando}>
                {enviando ? "Enviando…" : "Solicitar eliminación"}
              </button>

              <p className="legal-fecha">
                Consulta nuestra <Link to="/privacidad" className="legal-enlace">Política de privacidad</Link>.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default EliminarCuenta;
