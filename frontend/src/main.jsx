import ReactDOM from "react-dom/client";
import App from "./App"; // No necesitamos BrowserRouter aquí

ReactDOM.createRoot(document.getElementById("root")).render(
  <App /> // App ya está envuelta en BrowserRouter
);
