import { Link } from "react-router-dom";
import "../../styles/public/Legal.css";
import { CORREO_PRIVACIDAD, FECHA_ACTUALIZACION, POLITICA_PRIVACIDAD } from "./politicaPrivacidad";

// Página pública /privacidad: es la URL que se pega en Google Play Console.
function Privacidad() {
  return (
    <div className="legal">
      <div className="legal-contenedor">
        <div className="legal-hero">
          <h1>Política de Privacidad de Nova Graf Mobile</h1>
          <p>Aplica a la aplicación Nova Graf Mobile y al sitio web de Nova Graf. Última actualización: {FECHA_ACTUALIZACION}.</p>
        </div>

        <div className="legal-card">
          {POLITICA_PRIVACIDAD.map((s) => {
            // Agrupa los puntos seguidos en una sola lista
            const partes = [];
            s.bloques.forEach((b) => {
              const ultima = partes[partes.length - 1];
              if (b.t === "li") {
                if (ultima?.lista) ultima.items.push(b.x);
                else partes.push({ lista: true, items: [b.x] });
              } else partes.push({ lista: false, texto: b.x });
            });
            return (
              <section key={s.titulo}>
                <h3>{s.titulo}</h3>
                {partes.map((p, i) =>
                  p.lista ? (
                    <ul key={i}>
                      {p.items.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i}>{p.texto}</p>
                  )
                )}
              </section>
            );
          })}
        </div>

        <div className="legal-card">
          <h2>¿Quieres eliminar tu cuenta?</h2>
          <p>
            Hazlo desde la app (Perfil → Eliminar mi cuenta) o desde aquí:{" "}
            <Link to="/eliminar-cuenta" className="legal-enlace">Solicitar eliminación de cuenta</Link>. También puedes
            escribirnos a <a className="legal-enlace" href={`mailto:${CORREO_PRIVACIDAD}`}>{CORREO_PRIVACIDAD}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Privacidad;
