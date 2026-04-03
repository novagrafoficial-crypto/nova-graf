import { useEffect, useState } from "react";

const AdminEmpresa = () => {

  const [mision, setMision] = useState("");
  const [vision, setVision] = useState("");
  const [valores, setValores] = useState([]);

  const API = "http://localhost:5000/api/admin";

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {

    const resMision = await fetch(`${API}/mision`);
    const dataMision = await resMision.json();
    if (dataMision.length > 0) setMision(dataMision[0].descripcion);

    const resVision = await fetch(`${API}/vision`);
    const dataVision = await resVision.json();
    if (dataVision.length > 0) setVision(dataVision[0].descripcion);

    const resValores = await fetch(`${API}/valores`);
    const dataValores = await resValores.json();
    setValores(dataValores);

  };

  const guardarMision = async () => {

    await fetch(`${API}/mision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        empresa_id: 1,
        descripcion: mision
      })
    });

    alert("Misión guardada");
  };

  const guardarVision = async () => {

    await fetch(`${API}/vision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        empresa_id: 1,
        descripcion: vision
      })
    });

    alert("Visión guardada");
  };

  return (
    <div style={{padding:"30px"}}>

      <h1>Administración de Empresa</h1>

      {/* MISION */}
      <h2>Misión</h2>
      <textarea
        value={mision}
        onChange={(e)=>setMision(e.target.value)}
        rows="4"
        style={{width:"100%"}}
      />

      <br />
      <button onClick={guardarMision}>Guardar misión</button>


      {/* VISION */}
      <h2>Visión</h2>
      <textarea
        value={vision}
        onChange={(e)=>setVision(e.target.value)}
        rows="4"
        style={{width:"100%"}}
      />

      <br />
      <button onClick={guardarVision}>Guardar visión</button>


      {/* VALORES */}
      <h2>Valores</h2>

      <ul>
        {valores.map((v)=>(
          <li key={v.id}>
            <b>{v.valor}</b> - {v.descripcion}
          </li>
        ))}
      </ul>

    </div>
  );
};

export default AdminEmpresa;