import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:3001/api/proveedores/${id}`)
        .then((res) => res.json())
        .then((data) => setProveedor(data))
        .catch((err) => {
          setError('Error al cargar proveedor');
          setOpenSnackbar(true);
        });
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = id
      ? `http://localhost:3001/api/proveedores/${id}`
      : 'http://localhost:3001/api/proveedores';
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proveedor),
    })
      .then(() => navigate('/proveedores'))
      .catch((err) => {
        setError('Error al guardar');
        setOpenSnackbar(true);
      });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={12}>
                <TextField
                  helperText="Por favor ingrese el nombre"
                  label="Nombre"
                  variant="outlined"
                  fullWidth
                  value={proveedor.nombre}
                  onChange={(e) => setProveedor({ ...proveedor, nombre: e.target.value })}
                  required
                  />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Direccion"
                variant="outlined"
                fullWidth
                value={proveedor.direccion}
                onChange={(e) => setProveedor({ ...proveedor, direccion: e.target.value })}
              />
            </Grid>            
            <Grid item xs={12}>
              <TextField
                helperText="Por favor ingrese el telefono"
                label="Teléfono"
                variant="outlined"
                fullWidth
                value={proveedor.telefono}
                onChange={(e) => setProveedor({ ...proveedor, telefono: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                helperText="Por favor ingrese el email"
                label="Email"
                variant="outlined"
                fullWidth
                value={proveedor.email}
                onChange={(e) => setProveedor({ ...proveedor, email: e.target.value })}
              />
            </Grid>
            
          </Grid>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            sx={{ mt: 2, mr: 2 }}
          >
            {id ? 'Actualizar' : 'Guardar'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/proveedores')}
          >
            Cancelar
          </Button>
        </form>
      </Paper>
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