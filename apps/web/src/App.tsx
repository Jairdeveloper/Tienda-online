import AppRoutes from "./routes";
import MainLayout from "./components/layout/MainLayout";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import { ToastProvider } from "./components/shared/Toast";

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ToastProvider>
    </ErrorBoundary>
  );
}
