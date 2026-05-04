import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthCallback from './pages/auth/AuthCallback';
import DashboardLayout from './components/dashboard/DashboardLayout';
import AgendaPage from './pages/dashboard/AgendaPage';
import ServicesPage from './pages/dashboard/ServicesPage';
import ProfessionalsPage from './pages/dashboard/ProfessionalsPage';
import ClientsPage from './pages/dashboard/ClientsPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import ProductsPage from './pages/dashboard/ProductsPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import BookingPage from './pages/public/BookingPage';
import ContactPage from './pages/public/ContactPage';
import ClientLayout from './components/client/ClientLayout';
import MyBookingsPage from './pages/client/MyBookingsPage';
import ExplorePage from './pages/client/ExplorePage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import OverviewPage from './pages/dashboard/OverviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reservar/:businessSlug" element={<BookingPage />} />

          {/* Admin dashboard (protected) */}
           <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            <Route path="servicios" element={<ServicesPage />} />
            <Route path="profesionales" element={<ProfessionalsPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
          </Route>

          {/* Legacy route redirection */}
          <Route path="/mis-reservas" element={<Navigate to="/cliente/reservas" replace />} />

          {/* Client area (protected) */}
          <Route
            path="/cliente"
            element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="reservas" replace />} />
            <Route path="explorar" element={<ExplorePage />} />
            <Route path="reservas" element={<MyBookingsPage />} />
            <Route path="perfil" element={<ClientProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


