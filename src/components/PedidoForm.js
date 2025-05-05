import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    Container,
    Typography,
    Paper,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Autocomplete,
    Snackbar,
    Alert,
    CircularProgress,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import apiClient from '../api/client';

export default function PedidoForm() {
    const [proveedores, setProveedores] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);    
    const [pedido, setPedido] = useState({
        fecha: new Date().toISOString().split('T')[0],
        proveedor_id: null,
        renglones: [],
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Cargar proveedores al inicio
    useEffect(() => {
        fetchProveedores()
        initPedido()
    }, []);

    const initPedido = async () => {
        const ret = await apiClient.post(`/pedidos/nropedido`);
        setPedido({ ...pedido, numero_pedido: `PED-${ret.nro_pedido}`})
    }    

    const fetchProveedores = async () => {
        const ret = await apiClient.get(`/proveedores`)
        setProveedores(ret.data)
    }    

    // Cargar productos cuando se selecciona un proveedor
    useEffect(() => {
        const fetchProductos = async () => {
        setLoadingProductos(true);
        const data = await apiClient.get(`/proveedores/${pedido.proveedor_id}/productos`)
        setProductosDisponibles(data);
        setLoadingProductos(false);
        }        
        if (pedido.proveedor_id) {
            fetchProductos();
        }
    }, [pedido.proveedor_id]);

    const checkRenglonesValidos = () => {

        const ids = new Set();
        let esValido = true;

        // Detectar si algún renglón es inválido
        esValido = !pedido.renglones.some(({ producto_id, cantidad }) => {
            if (!producto_id || typeof cantidad !== 'number' || cantidad <= 0) return true;
            if (ids.has(producto_id)) return true;
            ids.add(producto_id);
            return false;
        });

        return esValido;    }

    const handleAddRenglon = () => {

        if (!pedido.proveedor_id) {
            setError('Primero selecciona un proveedor');
            return;
        }
        setPedido({
            ...pedido,
            renglones: [
                ...pedido.renglones,
                { producto_id: null, cantidad: 1, precio_unitario: 0 },
            ],
        });
    };

    const handleRemoveRenglon = (index) => {
        const newRenglones = [...pedido.renglones];
        newRenglones.splice(index, 1);
        setPedido({ ...pedido, renglones: newRenglones });
    };

    const addPedido = async () => {
        await apiClient.post(`/pedidos`, JSON.stringify(pedido))
        navigate('/pedidos')
    }

    const handleSubmit = () => {

        if (!pedido.proveedor_id || pedido.renglones.length === 0) {
            setError('Completa todos los campos requeridos');
            return;
        }

        if (!checkRenglonesValidos()) {
            setError('Hay inconsistencias en la lista de Productos, revise por favor los datos.');
            return;
        }

        addPedido()
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
                onClick={() => navigate('/pedidos')}
            >
                Volver a Pedidos
            </Button>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Nuevo Pedido
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        {pedido.numero_pedido !== undefined ? (
                            <TextField
                                label="Número de Pedido"
                                fullWidth
                                value={pedido.numero_pedido}
                                disabled
                            />
                        ) : (<CircularProgress />)}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Fecha"
                            type="date"
                            fullWidth
                            value={pedido.fecha}
                            onChange={(e) => setPedido({ ...pedido, fecha: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        {/* Selección de Proveedor (Obligatoria) */}
                        {proveedores && proveedores.length === 0 ? (
                            <CircularProgress />
                        ) : (
                                <Autocomplete
                                    options={Array.isArray(proveedores) ? proveedores : []}
                                    getOptionLabel={(option) => option.nombre}
                                    onChange={(e, value) =>
                                        setPedido({ ...pedido, proveedor_id: value?.id || null, renglones: [] })
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Proveedor *"
                                            error={!pedido.proveedor_id && error}
                                            helperText={!pedido.proveedor_id && "Selecciona un proveedor primero"}
                                        />
                                    )}
                                    fullWidth
                                    sx={{ mb: 3 }}
                                />
                        )}

                    </Grid>
                </Grid>

                {/* Sección de Productos (solo visible si hay proveedor) */}

                {pedido.proveedor_id && (
                    <>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Productos de {proveedores.find(p => p.id === pedido.proveedor_id)?.nombre}
                        </Typography>

                        {loadingProductos ? (
                            <CircularProgress />
                        ) : (
                        <>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddCircleIcon />}
                                        onClick={handleAddRenglon}
                                        sx={{ mb: 2 }}
                                    >
                                        Agregar Producto
                                    </Button>           
                                    <TableContainer component={Paper}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell>Cantidad</TableCell>
                                                    <TableCell>Precio Unitario</TableCell>
                                                    <TableCell>Subtotal</TableCell>
                                                    <TableCell>Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {pedido.renglones.map((renglon, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Autocomplete
                                                                options={productosDisponibles}
                                                                getOptionLabel={(option) => option.nombre}
                                                                onChange={(e, value) => {
                                                                    const newRenglones = [...pedido.renglones];
                                                                    newRenglones[index].producto_id = value?.id;
                                                                    newRenglones[index].precio_unitario = value?.precio_unitario || 0;
                                                                    setPedido({ ...pedido, renglones: newRenglones });
                                                                }}
                                                                renderInput={(params) => (
                                                                    <TextField {...params} label="Seleccionar" size="small" />
                                                                )}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                type="number"
                                                                value={renglon.cantidad}
                                                                onChange={(e) => {
                                                                    const newRenglones = [...pedido.renglones];
                                                                    newRenglones[index].cantidad = parseFloat(e.target.value);
                                                                    setPedido({ ...pedido, renglones: newRenglones });
                                                                }}
                                                                size="small"
                                                                inputProps={{ min: 1, step: 1 }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>${renglon.precio_unitario?.toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            ${(renglon.cantidad * renglon.precio_unitario)?.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton onClick={() => handleRemoveRenglon(index)}>
                                                                <DeleteIcon color="error" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>                                                     
                        </>)}                    
                    </>
                )}


                <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                    Total: $
                    {pedido.renglones
                        .reduce((sum, renglon) => sum + renglon.cantidad * renglon.precio_unitario, 0)
                        .toFixed(2)}
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSubmit}
                    sx={{ mt: 3 }}
                    disabled={!pedido.proveedor_id || pedido.renglones.length === 0}
                >
                    Guardar Pedido
                </Button>
            </Paper>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}