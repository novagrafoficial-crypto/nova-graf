// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, rolRequerido = "administrador" }) {
  // Obtener usuario del localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.rol || user?.tipo_usuario;
  const isAuthenticated = user?.id_usuario || user?.id;

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no es administrador, redirigir a home
  if (userRole !== rolRequerido && userRole !== "administrador" && userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return children;
}