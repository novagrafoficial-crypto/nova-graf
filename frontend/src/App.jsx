import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Correcto
import Header from "./components/Header"; // Asegúrate de que Header esté importado correctamente
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import Home from "./pages/public/Home";

function App() {
  return (
    <BrowserRouter> {/* Asegúrate de que BrowserRouter esté envolviendo toda la estructura */}
      <Header /> {/* El Header debe estar dentro de BrowserRouter */}
      <Routes> {/* Las rutas deben estar dentro de BrowserRouter */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
