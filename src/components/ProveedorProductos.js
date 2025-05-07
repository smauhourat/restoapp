import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Container,
  DialogActions,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api/client';

export default function ProveedorProductos() {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [allProductos, setAllProductos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    precio_compra: '',
    tiempo_entrega: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchData = async () => {
    const productosProveedor = await apiClient.get(`/proveedores/${id}/productos`)
    const productosDisponibles = await apiClient.get(`/proveedores/${id}/productos-disponibles`)

    setProductos(productosProveedor.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setAllProductos(productosDisponibles.sort((a, b) => a.nombre.localeCompare(b.nombre)))
  }

  // Filtrar productos disponibles localmente
  const filteredProductos = useMemo(() => {
    if (!searchInput) return allProductos;

    const searchTerm = searchInput.toLowerCase();
    return allProductos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm))
    );
  }, [allProductos, searchInput]);

  // Cargar productos del proveedor y todos los productos disponibles
  useEffect(() => {
    fetchData()
  }, [id]);

  // const addProducto = async () => {
  //   await apiClient.post(`/proveedores/${id}/productos`, JSON.stringify(formData))
  // }

  const addProducto = async () => {
    if (!formData.producto_id) {
      setError('Selecciona un producto');
      return;
    }
    await apiClient.post(`/proveedores/${id}/productos`, JSON.stringify(formData));
  };  

  const handleAddProducto = async () => {
    await addProducto()
    setOpenDialog(false);
    setFormData({ producto_id: '', precio_compra: '', tiempo_entrega: '' });
    fetchData()
  };  

  const handleAddAndStayProducto = async () => {
    await addProducto()
    //setFormData({ ...formData, precio_compra: '', tiempo_entrega: '' });
    setFormData({ producto_id: '', precio_compra: '', tiempo_entrega: '' });
    fetchData()
  }

  const deleteProducto = async (productoId) => {
    await apiClient.delete(`/proveedores/${id}/productos/${productoId}`)
    fetchData()
  }

  const handleDelete = async (productoId) => {
    await deleteProducto(productoId)
  };

  return (
    // <Paper sx={{ p: 3, mt: 3 }}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Productos del Proveedor
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 2 }}
        >
          Asignar Producto
        </Button>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell>Descripcion</TableCell>
                <TableCell>Precio Unitario</TableCell>
                <TableCell>Precio Compra</TableCell>
                <TableCell>Tiempo Entrega (días)</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>{producto.nombre}</TableCell>
                  <TableCell>{producto.descripcion}</TableCell>
                  <TableCell>${producto.precio_unitario}</TableCell>
                  <TableCell>${producto.precio_compra}</TableCell>
                  <TableCell>{producto.tiempo_entrega}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(producto.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Diálogo para asignar producto */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Asignar Producto al Proveedor</DialogTitle>
          <DialogContent sx={{ p: 3, minWidth: 400 }}>
            <Autocomplete
              options={filteredProductos}
              getOptionLabel={(option) => `${option.nombre} ($${option.precio_unitario})`}
              inputValue={searchInput}
              onInputChange={(_, newValue) => setSearchInput(newValue)}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  producto_id: newValue?.id || ''
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar producto"
                  placeholder="Escribe para buscar..."
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}
              noOptionsText="No se encontraron productos"
            />
            <TextField
              label="Precio de Compra"
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              value={formData.precio_compra}
              onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
            />
            <TextField
              label="Tiempo de Entrega (días)"
              type="number"
              fullWidth
              sx={{ mb: 2 }}
              value={formData.tiempo_entrega}
              onChange={(e) => setFormData({ ...formData, tiempo_entrega: e.target.value })}
            />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddAndStayProducto}
            fullWidth
            sx={{ mb: 2 }}
          >
            Guardar
          </Button>            
            <Button
              variant="contained"
              onClick={handleAddProducto}
              fullWidth
            >
              Guardar y Cerrar
            </Button>

          </DialogContent>
            <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
            </DialogActions>
        </Dialog>

        {/* Notificación de error */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mt: 2 }}
        onClick={() => navigate(-1)} // Vuelve a la Home
      >
        Volver atrás
      </Button>           
      </Container>
  //   </Paper>
   );
}