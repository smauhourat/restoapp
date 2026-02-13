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
  Stack,
  TextField,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import proveedorService from '../services/proveedorServices';

// Clave para el localStorage
const LOCALSTORAGE_KEY = 'proveedoresPerPage';

export default function ProveedorList() {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [proveedorToDelete, setProveedorToDelete] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    return saved ? parseInt(saved) : 10;
  });
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));  

  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm, page, perPage);
    } else {
      fetchProveedores();
    }
  }, [page, perPage]);

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, perPage.toString());
  }, [perPage]);
     
  const fetchProveedores = async () => {
    try {
      const { data, totalPages, total } = await proveedorService.getAll(page, perPage);
      setProveedores(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setTotalPages(totalPages);
      setTotalCount(total);
    } catch (error) {
      setError('Error al cargar los proveedores');
      console.error(error);
    }
  };

  const handleSearch = async (term, currentPage = 1, itemsPerPage = perPage) => {
    if (term.trim() === '') {
      setSearchTerm('');
      setPage(1);
      fetchProveedores();
      return;
    }

    setIsSearching(true);
    try {
      const { data, totalPages, total } = await proveedorService.getAll(
        currentPage,
        itemsPerPage,
        'nombre',
        'asc',
        term
      );
      setProveedores(data);
      setTotalPages(totalPages);
      setTotalCount(total);
      setSearchTerm(term);
      setPage(currentPage);
    } catch (error) {
      setError('Error al buscar proveedores');
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      setPage(1);
      handleSearch(searchTerm, 1, perPage);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
    fetchProveedores();
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

      {/* Barra de búsqueda */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar proveedores por nombre, email o teléfono (presione Enter para buscar)"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isSearching ? (
                  <CircularProgress size={20} />
                ) : searchTerm ? (
                  <IconButton
                    aria-label="limpiar búsqueda"
                    onClick={clearSearch}
                    edge="end"
                    size="small"
                  >
                    <ClearIcon />
                  </IconButton>
                ) : null}
              </InputAdornment>
            ),
          }}
        />
      </Box>

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

      {/* Información de resultados */}
      {searchTerm && (
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {isSearching ? 'Buscando...' : `Mostrando ${proveedores.length} de ${totalCount} resultados para "${searchTerm}"`}
        </Typography>
      )}

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
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 5} align="center">
                  <CircularProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>Buscando...</Typography>
                </TableCell>
              </TableRow>
            ) : proveedores.length > 0 ? (
              proveedores.map((proveedor) => (
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
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isMobile ? 2 : 5} align="center">
                  {searchTerm ? 'No se encontraron proveedores que coincidan con la búsqueda' : 'No hay proveedores disponibles'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación y controles */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography>Filas por página:</Typography>
            <Select
              value={perPage}
              onChange={(e) => {
                const newPerPage = e.target.value;
                setPerPage(newPerPage);
                setPage(1);
                if (searchTerm) {
                  handleSearch(searchTerm, 1, newPerPage);
                }
              }}
              size="small"
              sx={{ width: 80 }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
            <Typography>
              Total: {totalCount} proveedores
            </Typography>
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
      )}

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