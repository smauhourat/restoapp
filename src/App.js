import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import ResponsiveNavbar from './components/ResponsiveNavbar';
import Footer from './components/Footer';
import ProveedorList from './components/ProveedorList';
import ProveedorForm from './components/ProveedorForm';
import ProveedorProductos from './components/ProveedorProductos';
import ProveedorProductoForm from './components/ProveedorProductoForm';
import ProductoList from './components/ProductoList';
import ProductoForm from './components/ProductoForm';
import PedidoList from './components/PedidoList';
import PedidoForm from './components/PedidoForm';
import PedidoDetalle from './components/PedidoDetalle';
import ImportarProductos from './components/ImportarProductos';
import Dashboard from './components/Dashboard';
import EmpresaList from './components/EmpresaList';
import UsuarioList from './components/UsuarioList';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider, useToast } from './components/ToastProvider';
import { setAxiosErrorToastHandler } from './api/client';
import { ThemeModeProvider } from './context/ThemeModeContext.js';
import { AuthProvider } from './context/AuthContext.js';

function AppWrapper() {
  const { showToast } = useToast();
  setAxiosErrorToastHandler(showToast);
  return null;
}

function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <Router>
          <ToastProvider>
            <AppWrapper />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Routes>
              {/* Ruta pública */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/proveedores" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProveedorList />
                </ProtectedRoute>
              } />
              <Route path="/proveedores/nuevo" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProveedorForm />
                </ProtectedRoute>
              } />
              <Route path="/proveedores/editar/:id" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProveedorForm />
                </ProtectedRoute>
              } />
              <Route path="/proveedores/:id/productos" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProveedorProductos />
                </ProtectedRoute>
              } />
              <Route path="/proveedores/:proveedorId/productos/:productoId" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProveedorProductoForm />
                </ProtectedRoute>
              } />
              <Route path="/productos" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProductoList />
                </ProtectedRoute>
              } />
              <Route path="/productos/nuevo" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProductoForm />
                </ProtectedRoute>
              } />
              <Route path="/productos/editar/:id" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ProductoForm />
                </ProtectedRoute>
              } />
              <Route path="/pedidos" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <PedidoList />
                </ProtectedRoute>
              } />
              <Route path="/pedidos/nuevo" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <PedidoForm />
                </ProtectedRoute>
              } />
              <Route path="/pedidos/:id" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <PedidoDetalle />
                </ProtectedRoute>
              } />
              <Route path="/productos/importar" element={
                <ProtectedRoute>
                  <ResponsiveNavbar />
                  <ImportarProductos />
                </ProtectedRoute>
              } />
              <Route path="/empresas" element={
                <ProtectedRoute roles={['superadmin']}>
                  <ResponsiveNavbar />
                  <EmpresaList />
                </ProtectedRoute>
              } />
              <Route path="/empresas/:empresaId/usuarios" element={
                <ProtectedRoute roles={['superadmin']}>
                  <ResponsiveNavbar />
                  <UsuarioList />
                </ProtectedRoute>
              } />
            </Routes>
          <Footer />
          </Box>
          </ToastProvider>
        </Router>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

export default App;
