import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/products/:id"
        element={<div>Producto - Próximamente</div>}
      />
      <Route path="/cart" element={<div>Carrito - Próximamente</div>} />
      <Route path="/checkout" element={<div>Checkout - Próximamente</div>} />
      <Route path="/orders" element={<div>Pedidos - Próximamente</div>} />
      <Route
        path="/orders/:id"
        element={<div>Detalle Pedido - Próximamente</div>}
      />
      <Route path="/profile" element={<Profile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
