import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import 'leaflet/dist/leaflet.css';

function RootRouter() {
  const path = window.location.pathname;
  if (path === "/admin") return <AdminPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);  