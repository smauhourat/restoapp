import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProveedorList() {
  const [proveedores, setProveedores] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/proveedores')
      .then((res) => res.json())
      .then((data) => setProveedores(data));
  }, []);

  return (
    <div>
      <h1>Proveedores</h1>
      <Link to="/proveedores/nuevo">Nuevo Proveedor</Link>
      <ul>
        {proveedores.map((proveedor) => (
          <li key={proveedor.id}>
            {proveedor.nombre} - {proveedor.telefono}
            <Link to={`/proveedores/editar/${proveedor.id}`}>Editar</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}