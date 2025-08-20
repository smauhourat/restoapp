import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import proveedorServices from '../services/proveedorServices';

export default function ProveedorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proveedor, setProveedor] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
  });

  useEffect(() => {
      if (id) {
          fetchProveedor(id)
      }
  }, [id]);

  const fetchProveedor = async (id) => {
    const data = await proveedorServices.getById(id);
    setProveedor(data)
  }  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (id) {
      await proveedorServices.update(id, proveedor);
    } else {
      await proveedorServices.create(proveedor);
    }    
    navigate('/proveedores')
  }


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
                  size="small"
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
                size="small"
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
                size="small"
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
                size="small"
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
    </Container>
  );
}