import AppRoutes from "./routes";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <MainLayout>
      <AppRoutes />
    </MainLayout>
  );
}
