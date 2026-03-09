import { useState } from "react";
import "../../styles/Admin/AdminModulo.css";

function AdminModulo() {

  const [error, setError] = useState(null);

  const API_RESPALDO = "http://localhost:5000/api/admin/modulo";

  const handleGenerarRespaldo = async () => {
    setError(null);

    try {
      const res = await fetch(API_RESPALDO);

      if (!res.ok) throw new Error("Error al generar respaldo");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "respaldo_novagraf.zip";
      a.click();

      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modulo-container">

      <h2>Módulo de Gestión</h2>

      <div className="modulo-grid">

        {/* TARJETA RESPALDO */}
        <div className="modulo-card">

          <h3>Respaldo de Base de Datos</h3>

          <p>
            Genera una copia de seguridad de toda la base de datos del sistema.
          </p>

          <button onClick={handleGenerarRespaldo}>
            Generar respaldo
          </button>

          {error && <p className="error">{error}</p>}

        </div>


        {/* TARJETA FUTURA */}
        <div className="modulo-card">

          <h3>Mantenimiento</h3>

          <p>
            Herramientas para mantenimiento y administración del sistema.
          </p>

          <button disabled>
            Próximamente
          </button>

        </div>

      </div>

    </div>
  );
}

export default AdminModulo;
