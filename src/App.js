import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ResponsiveNavbar from './components/ResponsiveNavbar';
import Home from './components/Home';
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
import { ToastProvider, useToast } from './components/ToastProvider';
import { setAxiosErrorToastHandler } from './api/client';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme'; // Asegúrate de que la ruta sea correcta

function AppWrapper() {
  const { showToast } = useToast();
  setAxiosErrorToastHandler(showToast);
  return null; // este componente solo conecta axios con el toast
}

function App() {
  return (
    <ThemeProvider theme={theme}>
    <Router>
        <ResponsiveNavbar />
      <ToastProvider>
        <AppWrapper />
        <Routes>
          {/* <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/" element={<Dashboard />} />          
          <Route path="/proveedores" element={<ProveedorList />} />
          <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
          <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />
          <Route path="/proveedores/:id/productos" element={<ProveedorProductos />} />
          <Route path="/proveedores/:proveedorId/productos/:productoId" element={<ProveedorProductoForm />} />
          <Route path="/productos" element={<ProductoList />} />
          <Route path="/productos/nuevo" element={<ProductoForm />} />
          <Route path="/productos/editar/:id" element={<ProductoForm />} />        
          <Route path="/pedidos" element={<PedidoList />} />
          <Route path="/pedidos/nuevo" element={<PedidoForm />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} />
          <Route path="/productos/importar" element={<ImportarProductos />} />
        </Routes>
      </ToastProvider>
    </Router>
    </ThemeProvider>
  );
}

export default App;