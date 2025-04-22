import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ProveedorList from './components/ProveedorList';
import ProveedorForm from './components/ProveedorForm';
import ProveedorProductos from './components/ProveedorProductos';
import ProductoList from './components/ProductoList';
import ProductoForm from './components/ProductoForm';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/proveedores" element={<ProveedorList />} />
        <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />
        <Route path="/proveedores/:id/productos" element={<ProveedorProductos />} />
        <Route path="/productos" element={<ProductoList />} />
        <Route path="/productos/nuevo" element={<ProductoForm />} />
        <Route path="/productos/editar/:id" element={<ProductoForm />} />        
        {/* Rutas para Productos y Pedidos */}
      </Routes>
    </Router>
  );
}

export default App;