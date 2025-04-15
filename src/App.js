import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProveedorList from './components/ProveedorList';
import ProveedorForm from './components/ProveedorForm';
import ProveedorProductos from './components/ProveedorProductos';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/proveedores" element={<ProveedorList />} />
        <Route path="/proveedores/nuevo" element={<ProveedorForm />} />
        <Route path="/proveedores/editar/:id" element={<ProveedorForm />} />
        <Route path="/proveedores/:id/productos" element={<ProveedorProductos />} />
        {/* Rutas para Productos y Pedidos */}
      </Routes>
    </Router>
  );
}

export default App;