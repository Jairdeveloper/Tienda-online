import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ProductList from "../pages/ProductList";
import ProductDetail from "../pages/ProductDetail";
import CartPage from "../pages/Cart";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<CartPage />} />
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
