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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import apiClient from '../api/client';

export default function ProveedorList() {
  const [proveedores, setProveedores] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(3);  
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProveedores();
  }, [page, perPage]);

  const fetchProveedores = async () => {
    try {
      const { data, totalPages } = await apiClient.get('/proveedores', {
        params: { page, perPage }
      });
      setProveedores(data);
      setTotalPages(totalPages);
    } catch (err) {
      setError('Error al cargar proveedores');
    }
  };  

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/proveedores/${id}`)
      setProveedores(proveedores.filter((p) => p.id !== id))
    } catch (err) {
      setError('Error al eliminar un proveedor');
      setOpenSnackbar(true);
    }    
  }

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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proveedores.map((proveedor) => (
              <TableRow key={proveedor.id}>
                <TableCell>{proveedor.nombre}</TableCell>
                <TableCell>{proveedor.telefono}</TableCell>
                <TableCell>{proveedor.email}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/proveedores/editar/${proveedor.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/proveedores/${proveedor.id}/productos`)}
                  >
                    <InventoryIcon />
                  </IconButton>                  
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(proveedor.id)}
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
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="error" onClose={() => setOpenSnackbar(false)}>
          {error}
        </Alert>
      </Snackbar>

      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        sx={{ mt: 2 }}
        onClick={() => navigate('/')} // Vuelve a la Home
      >
        Volver atrás
      </Button>      
    </Container>
  );
}