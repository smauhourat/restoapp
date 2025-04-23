import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Container
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  // Cargar productos del proveedor y todos los productos disponibles
  useEffect(() => {
    fetch(`http://localhost:3001/api/proveedores/${id}/productos`)
      .then((res) => res.json())
      .then(setProductos);

    fetch('http://localhost:3001/api/productos')
      .then((res) => res.json())
      .then(setAllProductos);
  }, [id]);

  const handleAddProducto = () => {
    fetch(`http://localhost:3001/api/proveedores/${id}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
      .then(() => {
        setOpenDialog(false);
        // Recargar la lista
        fetch(`http://localhost:3001/api/proveedores/${id}/productos`)
          .then((res) => res.json())
          .then(setProductos);
      })
      .catch((err) => setError('Error al agregar producto'));
  };

  const handleDelete = (productoId) => {
    fetch(`http://localhost:3001/api/proveedores/${id}/productos/${productoId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setProductos(productos.filter((p) => p.id !== productoId));
      })
      .catch((err) => setError('Error al eliminar'));
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
          Añadir Producto
        </Button>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
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

        {/* Diálogo para añadir producto */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Añadir Producto al Proveedor</DialogTitle>
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