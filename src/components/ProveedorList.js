import { useTheme, useMediaQuery } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Container,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  Box,  
  Pagination,
  Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InventoryIcon from '@mui/icons-material/Inventory';

import proveedorService from '../services/proveedorServices';

// Clave para el localStorage
const LOCALSTORAGE_KEY = 'proveedoresPerPage';

export default function ProveedorList() {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  // Recuperar el valor guardado o usar 10 por defecto
  const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    return saved ? parseInt(saved) : 10;
  });
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));  

  useEffect(() => {
    fetchProveedores();
  }, [page, perPage]);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, perPage.toString());
  }, [perPage]);
    
  const fetchProveedores = async () => {
    const { data, totalPages } = await proveedorService.getAll(page, perPage);
    setProveedores(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setTotalPages(totalPages);
  };  

  const handleDelete = async (id) => {
    try {
      await proveedorService.delete(id);
      // Recargar los datos después de eliminar
      setProveedores(proveedores.filter((p) => p.id !== id))
      setOpenDeleteDialog(false);
    } catch (error) {
      setError('Error al eliminar el proveedor');
      console.error(error);
    }
  };  

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Proveedores
      </Typography>
      <Button
        component={Link}
        to="/proveedores/nuevo"
        variant="contained"
        color="primary"
        startIcon={<AddCircleIcon />}
        sx={{ mb: 3 }}
      >
        Nuevo Proveedor
      </Button>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {!isMobile ? (
                <>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>#Productos</TableCell>
                </>
              ) : (
                <>
                    <TableCell>Nombre</TableCell>
                </>
              )}

              <TableCell align="right" sx={{ paddingRight:'2rem' }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proveedores.map((proveedor) => (
              <TableRow key={proveedor.id}>
                {!isMobile ? (
                    <>
                      <TableCell>{proveedor.nombre}</TableCell>
                      <TableCell>{proveedor.telefono}</TableCell>
                      <TableCell>{proveedor.email}</TableCell>
                      <TableCell>{proveedor.productos}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{proveedor.nombre}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {proveedor.email}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {proveedor.telefono}
                          </Typography>                          
                        </Stack>
                      </TableCell>                      
                    </>
                  )}
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/proveedores/editar/${proveedor.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/proveedores/${proveedor.id}/productos`, {
                      state: { proveedorNombre: proveedor.nombre }
                    })}
                  >
                    <InventoryIcon />
                  </IconButton>                  
                  <IconButton
                    color="error"
                    onClick={() => {
                      setProveedorToDelete(proveedor.id);
                      setOpenDeleteDialog(true);
                    }}

                    // onClick={() => handleDelete(proveedor.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación y controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography>Filas por página:</Typography>
          <Select
            value={perPage}
            onChange={(e) => setPerPage(e.target.value)}
            size="small"
            sx={{ width: 80 }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </Stack>

        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>      

      {/* Diálogo de confirmación para eliminar */}
      <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
      >
          <DialogTitle>¿Eliminar proveedor?</DialogTitle>
          <DialogContent>
              <DialogContentText>
                  Esta acción no se puede deshacer. ¿Estás seguro?
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
              <Button
                  onClick={() => handleDelete(proveedorToDelete)}
                  color="error"
                  autoFocus
              >
                  Eliminar
              </Button>
          </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}