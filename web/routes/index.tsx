import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ProductList from "../pages/ProductList";
import ProductDetail from "../pages/ProductDetail";
import CartPage from "../pages/Cart";
import CheckoutPage from "../pages/Checkout";
import OrderList from "../pages/OrderList";
import OrderDetail from "../pages/OrderDetail";
import Payment from "../pages/Payment";
import PaymentResult from "../pages/PaymentResult";
import AdminRoute from "../components/admin/AdminRoute";
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";
import AdminOrders from "../pages/admin/Orders";
import AdminOrderDetail from "../pages/admin/OrderDetail";
import AdminProducts from "../pages/admin/Products";
import AdminProductForm from "../pages/admin/ProductForm";
import AdminInventory from "../pages/admin/Inventory";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/orders" element={<OrderList />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/orders/:orderId/pay" element={<Payment />} />
      <Route path="/payment/result" element={<PaymentResult />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminOrders />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminOrderDetail />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/new"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductForm />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/products/:id/edit"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminProductForm />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminInventory />
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
