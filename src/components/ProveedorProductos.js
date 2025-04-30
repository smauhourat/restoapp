import { useEffect, useState } from 'react';
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
  DialogActions
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
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const fetchData = async () => {
    const productosProveedor = await apiClient.get(`/proveedores/${id}/productos`)
    const productosTodos = await apiClient.get(`/productos`)
    const productosDisponibles = productosTodos.data
      .filter(p1 => !productos.some(p2 => p2.id === p1.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    setProductos(productosProveedor.sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setAllProductos(productosDisponibles)
  }

  // Cargar productos del proveedor y todos los productos disponibles
  useEffect(() => {
    fetchData()
    console.log('productos =>', productos)
    console.log('allProductos =>', allProductos)
  }, [id]);

  const addProducto = async () => {
    try {
      await apiClient.post(`/proveedores/${id}/productos`, JSON.stringify(formData))
      setOpenDialog(false);
      fetchData()
    } catch(err) {
      setError('Error al agregar producto')
    }
  }

  const handleAddProducto = async () => {
    await addProducto()
  };  

  const deleteProducto = async (productoId) => {
    try {
      await apiClient.delete(`/proveedores/${id}/productos/${productoId}`)
      fetchData()
    } catch (err) {
      setError('Error al agregar producto')
    }    
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
            <TextField
              select
              label="Producto"
              fullWidth
              sx={{ mb: 2 }}
              value={formData.producto_id}
              onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
            >
              {allProductos.map((producto) => (
                <MenuItem key={producto.id} value={producto.id}>
                  {producto.nombre} (${producto.precio_unitario})
                </MenuItem>
              ))}
            </TextField>
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
              onClick={handleAddProducto}
              fullWidth
            >
              Guardar
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