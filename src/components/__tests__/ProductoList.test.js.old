import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductoList from '../components/ProductoList';

// Mock de axios si se usa
jest.mock('axios');

describe('ProductoList Component', () => {
  it('renders the component', async () => {
    render(<ProductoList />);
    // Esperar a que cargue
    await waitFor(() => {
      expect(screen.getByText(/productos/i)).toBeInTheDocument();
    });
  });

  it('displays products in the table', async () => {
    // Mock data
    const mockProducts = [
      { id: 1, nombre: 'Producto 1', descripcion: 'Desc 1', unidad_medida: 'kg' }
    ];
    // Asumir que hay un estado o props para productos
    render(<ProductoList />);
    // Verificar que se renderiza
  });
});