import { useState, useEffect } from "react";
import ClientHeader from "../../components/client/ClientHeader";

function ClientProfile() {
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/users/profile/${user.id_usuario}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm(data);
        setLoading(false);
      });
  }, [user.id_usuario]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/profile/${user.id_usuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setEditing(false);
        setMessage("✅ Perfil actualizado correctamente");
        // Actualizar nombre en localStorage
        const updatedUser = { ...user, nombre: data.user.nombre };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setMessage("❌ Error al actualizar");
      }
    } catch {
      setMessage("❌ Error de conexión");
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: "2rem" }}>Cargando perfil...</p>;

  const fields = [
    { label: "Nombre", name: "nombre" },
    { label: "Apellido Paterno", name: "apellido_paterno" },
    { label: "Apellido Materno", name: "apellido_materno" },
    { label: "Usuario", name: "nombre_usuario" },
    { label: "Fecha de Nacimiento", name: "fecha_nacimiento", type: "date" },
    { label: "Domicilio", name: "domicilio" },
    { label: "Teléfono", name: "telefono" },
  ];

  return (
    <>
      <ClientHeader user={user} />
      <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
        
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{
            width: "70px", height: "70px", borderRadius: "50%",
            background: "#6366f1", color: "#fff", fontSize: "2rem",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"
          }}>
            {profile?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{profile?.nombre} {profile?.apellido_paterno}</h2>
            <p style={{ margin: 0, color: "#888" }}>{profile?.correo_electronico}</p>
            <span style={{
              fontSize: "0.75rem", background: "#e0e7ff", color: "#4338ca",
              padding: "2px 8px", borderRadius: "999px"
            }}>
              {profile?.proveedor === "google" ? "Cuenta Google" : "Cuenta local"}
            </span>
          </div>
        </div>

        {/* Tarjeta de datos */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
            <h3 style={{ margin: 0 }}>Información personal</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)} style={{
                background: "#6366f1", color: "#fff", border: "none",
                padding: "8px 18px", borderRadius: "8px", cursor: "pointer"
              }}>
                ✏️ Editar
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleSave} style={{
                  background: "#22c55e", color: "#fff", border: "none",
                  padding: "8px 18px", borderRadius: "8px", cursor: "pointer"
                }}>
                  💾 Guardar
                </button>
                <button onClick={() => { setEditing(false); setForm(profile); }} style={{
                  background: "#ef4444", color: "#fff", border: "none",
                  padding: "8px 18px", borderRadius: "8px", cursor: "pointer"
                }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {fields.map(({ label, name, type = "text" }) => (
            <div key={name} style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", color: "#888", marginBottom: "4px" }}>
                {label}
              </label>
              {editing ? (
                <input
                  type={type}
                  name={name}
                  value={
                    type === "date" && form[name]
                      ? form[name].split("T")[0]
                      : form[name] || ""
                  }
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: "8px",
                    border: "1px solid #d1d5db", fontSize: "0.95rem", boxSizing: "border-box"
                  }}
                />
              ) : (
                <p style={{ margin: 0, padding: "10px 0", borderBottom: "1px solid #f3f4f6", color: "#111" }}>
                  {name === "fecha_nacimiento" && profile[name]
                    ? new Date(profile[name]).toLocaleDateString("es-MX")
                    : profile[name] || <span style={{ color: "#bbb" }}>Sin información</span>}
                </p>
              )}
            </div>
          ))}

          {/* Email — solo lectura siempre */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", color: "#888", marginBottom: "4px" }}>
              Correo electrónico
            </label>
            <p style={{ margin: 0, padding: "10px 0", color: "#666" }}>
              {profile?.correo_electronico}
              <span style={{ fontSize: "0.75rem", color: "#aaa", marginLeft: "8px" }}>(no editable)</span>
            </p>
          </div>
        </div>

        {message && (
          <p style={{ textAlign: "center", marginTop: "1rem", color: message.includes("✅") ? "#22c55e" : "#ef4444" }}>
            {message}
          </p>
        )}
      </div>
    </>
  );
}

export default ClientProfile;