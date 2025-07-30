import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Snackbar,
  Alert,
  Container,
  DialogActions,
  Autocomplete,
  MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import apiClient from '../api/client';
const UNIDADES_MEDIDA = ['unidad', 'kg', 'litro', 'metro', 'caja'];

export default function ProveedorProductos() {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [allProductos, setAllProductos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    precio_unitario: '',
    tiempo_entrega: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [error, setError] = useState('');
  const [selectedProducto, setSelectedProducto] = useState(null);

  // Nuevos estados para la creación de productos
  const [openNewProductDialog, setOpenNewProductDialog] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_unitario: '',
  });
  const [newProductError, setNewProductError] = useState('');
  const [asignProductError, setAsignProductError] = useState('');


  const location = useLocation();
  const navigate = useNavigate();

  // Obtenemos el nombre del proveedor desde el estado de la navegación
  const proveedorNombre = location.state?.proveedorNombre || 'Proveedor';

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

  const addProducto = async () => {
    if (!formData.producto_id) {
      setError('Selecciona un producto');
      return;
    }
    await apiClient.post(`/proveedores/${id}/productos`, JSON.stringify(formData));
  };

  const handleAddProducto = async () => {
    if (!formData.nombre || !formData.unidad_medida) {
      setAsignProductError('El nombre y la unidad de medida son obligatorios.');
      return;
    }    
    await addProducto()
    setAsignProductError('');
    setOpenDialog(false);
    setFormData({ producto_id: '', precio_unitario: '', tiempo_entrega: '' });
    fetchData()
  };

  const handleAddAndStayProducto = async () => {
    if (!formData.nombre || !formData.unidad_medida) {
      setAsignProductError('El nombre y la unidad de medida son obligatorios.');
      return;
    }        
    await addProducto()
    setFormData({ ...formData, precio_unitario: '', tiempo_entrega: '' });
    setSelectedProducto(null);
    setAsignProductError('');
    fetchData()
  }

  const deleteProducto = async (productoId) => {
    await apiClient.delete(`/proveedores/${id}/productos/${productoId}`)
    fetchData()
  }

  const handleDelete = async (productoId) => {
    await deleteProducto(productoId)
  };

  // Nueva función para crear un producto
  const handleCreateNewProduct = async () => {
    if (!newProductFormData.nombre || !newProductFormData.unidad_medida) {
      setNewProductError('El nombre y la unidad de medida son obligatorios.');
      return;
    }
    try {
      const response = await apiClient.post('/productos', JSON.stringify(newProductFormData));
      // Asignar el nuevo producto creado al formulario de asignación
      setSelectedProducto(response); // Asume que la API devuelve el objeto completo del producto creado
      setFormData({
        ...formData,
        producto_id: response.id,
      });
      setOpenNewProductDialog(false);
      setNewProductFormData({ nombre: '', descripcion: '', unidad_medida: '' });
      setNewProductError('');
      fetchData(); // Recargar la lista de todos los productos para incluir el nuevo
    } catch (err) {
      setNewProductError('Error al crear el producto: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    // <Paper sx={{ p: 3, mt: 3 }}>
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Productos del Proveedor: {proveedorNombre}
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
            getOptionLabel={(option) => option.nombre ? `${option.nombre} (${option.descripcion})` : ''}
            inputValue={searchInput}
            onInputChange={(_, newInputValue) => setSearchInput(newInputValue)}
            value={selectedProducto}
            onChange={(_, newValue) => {
              if (typeof newValue === 'string') {
                // El usuario ha escrito un nuevo producto
                setNewProductFormData({ ...newProductFormData, nombre: newValue });
                setOpenNewProductDialog(true);
              } else if (newValue && newValue.inputValue) {
                // Esto es para el caso de "Add X" que Autocomplete puede generar
                setNewProductFormData({ ...newProductFormData, nombre: newValue.inputValue });
                setOpenNewProductDialog(true);
              } else {
                setSelectedProducto(newValue);
                setFormData({
                  ...formData,
                  producto_id: newValue?.id || ''
                });
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filteredProductos.filter(option =>
                option.nombre.toLowerCase().includes(params.inputValue.toLowerCase()) ||
                (option.descripcion && option.descripcion.toLowerCase().includes(params.inputValue.toLowerCase()))
              );

              // Sugerir la opción de "Crear nuevo producto" si no hay coincidencias exactas
              if (params.inputValue !== '' && !filtered.some(option => option.nombre.toLowerCase() === params.inputValue.toLowerCase())) {
                filtered.push({
                  inputValue: params.inputValue,
                  nombre: `Añadir "${params.inputValue}"`,
                });
              }

              return filtered;
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            renderOption={(props, option) => <li {...props}>{option.nombre}</li>}
            freeSolo // Permite la entrada de texto libre
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar o crear producto"
                placeholder="Escribe para buscar o añadir..."
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
            noOptionsText="No se encontraron productos"
          />
          <TextField
            label="Precio Unitario"
            type="number"
            fullWidth
            required
            sx={{ mb: 2 }}
            value={formData.precio_unitario}
            onChange={(e) => setFormData({ ...formData, precio_unitario: e.target.value })}
          />
          <TextField
            label="Tiempo de Entrega (días)"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.tiempo_entrega}
            onChange={(e) => setFormData({ ...formData, tiempo_entrega: e.target.value })}
          />
          {asignProductError && (
            <Alert severity="error" sx={{ mb: 2 }}>{asignProductError}</Alert>
          )}          
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
          <Button onClick={() => {
            setAsignProductError('');
            setOpenDialog(false)}}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Nuevo Diálogo para crear producto */}
      <Dialog open={openNewProductDialog} onClose={() => setOpenNewProductDialog(false)}>
        <DialogTitle>Nuevo Producto</DialogTitle>
        <DialogContent sx={{ p: 3, minWidth: 400 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={newProductFormData.nombre}
            onChange={(e) => setNewProductFormData({ ...newProductFormData, nombre: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            select
            label="Unidad de Medida"
            size="small"
            variant="outlined"
            fullWidth
            value={newProductFormData.unidad_medida}
            onChange={(e) => setNewProductFormData({ ...newProductFormData, unidad_medida: e.target.value })}
          >
            {UNIDADES_MEDIDA.map((unidad) => (
              <MenuItem key={unidad} value={unidad}>
                {unidad}
              </MenuItem>
            ))}
          </TextField>          
          <TextField
            margin="dense"
            label="Descripción (opcional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newProductFormData.descripcion}
            onChange={(e) => setNewProductFormData({ ...newProductFormData, descripcion: e.target.value })}
            sx={{ mb: 2 }}
          />
          {newProductError && (
            <Alert severity="error" sx={{ mb: 2 }}>{newProductError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCreateNewProduct} 
            variant="contained" 
            startIcon={<SaveIcon />}
            color="primary">
            Guardar
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setOpenNewProductDialog(false)}>
            Cancelar</Button>          
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
