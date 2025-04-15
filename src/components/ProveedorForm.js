import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:3001/api/proveedores/${id}`)
        .then((res) => res.json())
        .then((data) => setProveedor(data));
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = id
      ? `http://localhost:3001/api/proveedores/${id}`
      : 'http://localhost:3001/api/proveedores';
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedor),
    }).then(() => navigate('/proveedores'));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={proveedor.nombre}
        onChange={(e) => setProveedor({ ...proveedor, nombre: e.target.value })}
        placeholder="Nombre"
      />
      {/* Otros campos */}
      <button type="submit">{id ? 'Actualizar' : 'Crear'}</button>
    </form>
  );
}