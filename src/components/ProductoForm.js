import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    Container,
    Typography,
    Paper,
    Grid,
    MenuItem,
    Snackbar,
    Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const UNIDADES_MEDIDA = ['unidad', 'kg', 'litro', 'metro', 'caja'];

export default function ProductoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [producto, setProducto] = useState({
        nombre: '',
        descripcion: '',
        precio_unitario: '',
        unidad_medida: 'unidad',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetch(`http://localhost:3001/api/productos/${id}`)
                .then((res) => res.json())
                .then(setProducto)
                .catch((err) => setError('Error al cargar producto'));
        }
    }, [id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const url = id
            ? `http://localhost:3001/api/productos/${id}`
            : 'http://localhost:3001/api/productos';
        const method = id ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(producto),
        })
            .then(() => navigate('/productos'))
            .catch((err) => setError('Error al guardar'));
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    {id ? 'Editar Producto' : 'Nuevo Producto'}
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                label="Nombre"
                                variant="outlined"
                                fullWidth
                                value={producto.nombre}
                                onChange={(e) => setProducto({ ...producto, nombre: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Precio Unitario"
                                type="number"
                                variant="outlined"
                                fullWidth
                                value={producto.precio_unitario}
                                onChange={(e) => setProducto({ ...producto, precio_unitario: e.target.value })}
                                required
                                inputProps={{ step: "0.01", min: "0" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Unidad de Medida"
                                variant="outlined"
                                fullWidth
                                value={producto.unidad_medida}
                                onChange={(e) => setProducto({ ...producto, unidad_medida: e.target.value })}
                            >
                                {UNIDADES_MEDIDA.map((unidad) => (
                                    <MenuItem key={unidad} value={unidad}>
                                        {unidad}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Descripción"
                                variant="outlined"
                                fullWidth
                                multiline
                                rows={3}
                                value={producto.descripcion}
                                onChange={(e) => setProducto({ ...producto, descripcion: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ mt: 2, mr: 2 }}
                    >
                        {id ? 'Actualizar' : 'Guardar'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/productos')}
                    >
                        Cancelar
                    </Button>
                </form>
            </Paper>
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}