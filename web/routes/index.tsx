import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminRoute from "../components/admin/AdminRoute";
import AdminLayout from "../components/admin/AdminLayout";
import Skeleton from "../components/shared/Skeleton";

const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Profile = lazy(() => import("../pages/Profile"));
const ProductList = lazy(() => import("../pages/ProductList"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const CartPage = lazy(() => import("../pages/Cart"));
const CheckoutPage = lazy(() => import("../pages/Checkout"));
const OrderList = lazy(() => import("../pages/OrderList"));
const OrderDetail = lazy(() => import("../pages/OrderDetail"));
const Payment = lazy(() => import("../pages/Payment"));
const PaymentResult = lazy(() => import("../pages/PaymentResult"));
const AdminDashboard = lazy(() => import("../pages/admin/Dashboard"));
const AdminOrders = lazy(() => import("../pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("../pages/admin/OrderDetail"));
const AdminProducts = lazy(() => import("../pages/admin/Products"));
const AdminProductForm = lazy(() => import("../pages/admin/ProductForm"));
const AdminInventory = lazy(() => import("../pages/admin/Inventory"));

function PageFallback() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="card" />
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="60%" />
      </div>
    </div>
  );
}

function AdminFallback() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton variant="text" width="30%" />
      <Skeleton variant="table-row" />
      <Skeleton variant="table-row" />
      <Skeleton variant="table-row" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
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

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminDashboard />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminOrders />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders/:id"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminOrderDetail />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminProducts />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminProductForm />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminProductForm />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <AdminLayout>
                <Suspense fallback={<AdminFallback />}>
                  <AdminInventory />
                </Suspense>
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
