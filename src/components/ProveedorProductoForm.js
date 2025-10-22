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

import proveedorServices from '../services/proveedorServices';

const UNIDADES_MEDIDA = ['unidad', 'kg', 'litro', 'metro', 'caja'];

export default function ProveedorProductoForm() {
    const { proveedorId, productoId } = useParams();

    const [productoProveedor, setProductoProveedor] = useState({
        nombre: '',
        descripcion: '',
        precio_unitario: '',
        unidad_medida: 'unidad',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProductoProveedor(proveedorId, productoId);
    }, []);

    const fetchProductoProveedor = async (proveedorId, productoId) => {
        const data = await proveedorServices.getProductoProveedor(proveedorId, productoId);
        console.log('Producto Proveedor =>', data)
        setProductoProveedor(data)
    } 

    const handleSubmit = async (e) => {
        e.preventDefault();

        await proveedorServices.updateProductoProveedor(proveedorId, productoId, productoProveedor);

        navigate(`/proveedores/${proveedorId}/productos`)
    }


    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Editar Producto del Proveedor
                </Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item size={12}>
                            <TextField
                                label="Nombre"
                                variant="outlined"
                                size="small"
                                disabled="true"
                                fullWidth
                                value={productoProveedor.nombre}
                                onChange={(e) => setProductoProveedor({ ...productoProveedor, nombre: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item size={12}>
                            <TextField
                                label="Precio Unitario"
                                variant="outlined"
                                type="number"
                                size="small"
                                fullWidth
                                value={productoProveedor.precio_unitario}
                                onChange={(e) => setProductoProveedor({ ...productoProveedor, precio_unitario: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item size={12}>
                            <TextField
                                select
                                label="Unidad de Medida"
                                size="small"
                                disabled="true"
                                variant="outlined"
                                fullWidth
                                value={productoProveedor.unidad_medida}
                                onChange={(e) => setProductoProveedor({ ...productoProveedor, unidad_medida: e.target.value })}
                            >
                                {UNIDADES_MEDIDA.map((unidad) => (
                                    <MenuItem key={unidad} value={unidad}>
                                        {unidad}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item size={12}>
                            <TextField
                                label="Descripción"
                                disabled="true"
                                fullWidth
                                multiline
                                rows={3}
                                value={productoProveedor.descripcion}
                                onChange={(e) => setProductoProveedor({ ...productoProveedor, descripcion: e.target.value })}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        height: 'auto',
                                        minHeight: '56px',
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ mt: 2, mr: 2 }}
                    >
                        Actualizar
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/proveedores/${proveedorId}/productos`)}
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

