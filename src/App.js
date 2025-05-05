import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ProveedorList from './components/ProveedorList';
import ProveedorForm from './components/ProveedorForm';
import ProveedorProductos from './components/ProveedorProductos';
import ProductoList from './components/ProductoList';
import ProductoForm from './components/ProductoForm';
import PedidoList from './components/PedidoList';
import PedidoForm from './components/PedidoForm';
import PedidoDetalle from './components/PedidoDetalle';
import { ToastProvider, useToast } from './components/ToastProvider';
import { setAxiosErrorToastHandler } from './api/client';

function AppWrapper() {
  const { showToast } = useToast();
  setAxiosErrorToastHandler(showToast);
  return null; // este componente solo conecta axios con el toast
}

function App() {
  return (
    <Router>
      <Navbar />
      <ToastProvider>
        <AppWrapper />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/proveedores" element={<ProveedorList />} />
          <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
          <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />
          <Route path="/proveedores/:id/productos" element={<ProveedorProductos />} />
          <Route path="/productos" element={<ProductoList />} />
          <Route path="/productos/nuevo" element={<ProductoForm />} />
          <Route path="/productos/editar/:id" element={<ProductoForm />} />        
          <Route path="/pedidos" element={<PedidoList />} />
          <Route path="/pedidos/nuevo" element={<PedidoForm />} />
          <Route path="/pedidos/:id" element={<PedidoDetalle />} /> {/* Para ver detalles */}        
          {/* Rutas para Productos y Pedidos */}
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;