import { useState, useEffect } from "react";
import "../../styles/Admin/AdminModulo.css";

function AdminModulo() {

  const API = "http://localhost:5000/api/admin/modulo";

  const [historial, setHistorial] = useState([]);
  const [tablas, setTablas] = useState([]);
  const [tablaSeleccionada, setTablaSeleccionada] = useState("");

  const cargarHistorial = async () => {
    const res = await fetch(`${API}/historial`);
    const data = await res.json();
    setHistorial(data);
  };

  const cargarTablas = async () => {
    const res = await fetch(`${API}/tablas`);
    const data = await res.json();
    setTablas(data);
  };

  useEffect(() => {
    cargarHistorial();
    cargarTablas();
  }, []);

  const descargarArchivo = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const urlBlob = window.URL.createObjectURL(blob);

    // ✅ FIX: regex más robusto para leer el header content-disposition
    const contentDisposition = res.headers.get("content-disposition");
    let fileName = "respaldo.dump";

    if (contentDisposition) {
      const match = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (match?.[1]) {
        fileName = match[1].replace(/['"]/g, "").trim();
      }
    }

    const a = document.createElement("a");
    a.href = urlBlob;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(urlBlob);

    setTimeout(cargarHistorial, 500);
  };

  return (
    <div className="modulo-container">

      <h2>Módulo de Respaldo</h2>

      <div className="modulo-card">
        <h3>Respaldo completo</h3>
        <button onClick={() => descargarArchivo(API)}>
          Generar respaldo completo
        </button>
      </div>

      <div className="modulo-card">
        <h3>Respaldo por tabla</h3>

        <select
          value={tablaSeleccionada}
          onChange={(e) => setTablaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar tabla</option>
          {tablas.map((t, i) => (
            <option key={i} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          disabled={!tablaSeleccionada}
          onClick={() => descargarArchivo(`${API}/tabla/${tablaSeleccionada}`)}
        >
          Respaldar tabla
        </button>
      </div>

      <div className="modulo-card">
        <h3>Historial de respaldos</h3>

        <table>
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Fecha</th>
              <th>Tamaño</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((item, index) => (
              <tr key={index}>
                <td>{item.nombre}</td>
                <td>{new Date(item.fecha).toLocaleString()}</td>
                <td>{item.tamaño}</td>
                <td>{item.tipo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default AdminModulo;