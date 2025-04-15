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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Inventory from '@mui/icons-material/Inventory';

export default function ProveedorList() {
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/proveedores')
      .then((res) => res.json())
      .then((data) => setProveedores(data))
      .catch((err) => {
        setError('Error al cargar proveedores');
        setOpenSnackbar(true);
      });
  }, []);

  const handleDelete = (id) => {
    fetch(`http://localhost:3001/api/proveedores/${id}`, { method: 'DELETE' })
      .then(() => setProveedores(proveedores.filter((p) => p.id !== id)))
      .catch((err) => {
        setError('Error al eliminar');
        setOpenSnackbar(true);
      });
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
  productos
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