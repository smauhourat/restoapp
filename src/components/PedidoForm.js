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
    Box,
    Dialog, // Importar Dialog
    DialogActions, // Importar DialogActions
    DialogContent, // Importar DialogContent
    DialogContentText, // Importar DialogContentText
    DialogTitle, // Importar DialogTitle
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Stack from '@mui/material/Stack';
import apiClient from '../api/client';

export default function PedidoForm() {
    const [proveedores, setProveedores] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableProductQuantities, setAvailableProductQuantities] = useState({});

    const [pedido, setPedido] = useState({
        fecha: new Date().toISOString().split('T')[0],
        proveedor_id: null,
        renglones: [],
        numero_pedido: '',
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Estados para el diálogo de confirmación
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [pendingProveedorId, setPendingProveedorId] = useState(null);
    const [pendingProveedorValue, setPendingProveedorValue] = useState(null); // Para revertir el Autocomplete

    // Cargar proveedores al inicio
    useEffect(() => {
        fetchProveedores();
        initPedido();
    }, []);

    const initPedido = async () => {
        try {
            const ret = await apiClient.post(`/pedidos/nropedido`);
            setPedido(prevPedido => ({ ...prevPedido, numero_pedido: `PED-${ret.nro_pedido}` }));
        } catch (err) {
            setError('Error al obtener el número de pedido.');
            console.error(err);
        }
    };

    const fetchProveedores = async () => {
        try {
            const ret = await apiClient.get(`/proveedores`);
            setProveedores(ret.data);
        } catch (err) {
            setError('Error al cargar los proveedores.');
            console.error(err);
        }
    };

    // Cargar productos cuando se selecciona un proveedor
    useEffect(() => {
        const fetchProductos = async () => {
            setLoadingProductos(true);
            try {
                const data = await apiClient.get(`/proveedores/${pedido.proveedor_id}/productos`);
                setProductosDisponibles(data);

                const initialQuantities = {};
                data.forEach(product => {
                    initialQuantities[product.id] = 1;
                });
                setAvailableProductQuantities(initialQuantities);
            } catch (err) {
                setError('Error al cargar los productos del proveedor.');
                console.error(err);
            } finally {
                setLoadingProductos(false);
            }
        };

        if (pedido.proveedor_id) {
            fetchProductos();

        } else {
            setProductosDisponibles([]);
            setAvailableProductQuantities({});
        }
    }, [pedido.proveedor_id]);


    const filteredProductosDisponibles = productosDisponibles.filter(product =>
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const checkRenglonesValidos = () => {
        const ids = new Set();
        let esValido = true;

        esValido = !pedido.renglones.some(({ producto_id, cantidad }) => {
            if (!producto_id || typeof cantidad !== 'number' || cantidad <= 0) {
                setError('Hay productos con cantidad inválida o sin seleccionar.');
                return true;
            }
            if (ids.has(producto_id)) {
                setError('Hay productos duplicados en el pedido.');
                return true;
            }
            ids.add(producto_id);
            return false;
        });

        return esValido;
    };

    const handleAvailableProductQuantityChange = (productId, quantity) => {
        setAvailableProductQuantities(prevQuantities => ({
            ...prevQuantities,
            [productId]: Math.max(1, parseInt(quantity) || 1),
        }));
    };

    const handleAddProductToOrder = (product) => {
        const quantity = availableProductQuantities[product.id] || 1;

        if (quantity <= 0) {
            setError('La cantidad debe ser mayor a 0 para agregar un producto.');
            return;
        }

        const existingRenglonIndex = pedido.renglones.findIndex(
            (r) => r.producto_id === product.id
        );

        if (existingRenglonIndex > -1) {

            const newRenglones = [...pedido.renglones];
            newRenglones[existingRenglonIndex].cantidad += quantity;
            setPedido({ ...pedido, renglones: newRenglones });
        } else {

            setPedido({
                ...pedido,
                renglones: [
                    ...pedido.renglones,
                    {
                        producto_id: product.id,
                        nombre_producto: product.nombre,
                        cantidad: quantity,
                        precio_unitario: product.precio_unitario,
                    },
                ],
            });
        }
        setError('');
    };

    const handleRemoveRenglon = (index) => {
        const newRenglones = [...pedido.renglones];
        newRenglones.splice(index, 1);
        setPedido({ ...pedido, renglones: newRenglones });
    };

    const addPedido = async () => {
        try {
            await apiClient.post(`/pedidos`, JSON.stringify(pedido));
            navigate('/pedidos');
        } catch (err) {
            setError('Error al guardar el pedido.');
            console.error(err);
        }
    };

    const handleSubmit = () => {
        if (!pedido.proveedor_id || pedido.renglones.length === 0) {
            setError('Selecciona un proveedor y agrega al menos un producto al pedido.');
            return;
        }

        if (!checkRenglonesValidos()) {
            return;
        }

        addPedido();
    };

    // Manejo del cambio de proveedor con confirmación
    const handleProveedorChange = (event, value) => {
        const newProveedorId = value?.id || null;
        if (pedido.renglones.length > 0 && newProveedorId !== pedido.proveedor_id) {
            setPendingProveedorId(newProveedorId);
            setPendingProveedorValue(value); // Guardar el objeto completo para el Autocomplete
            setOpenConfirmDialog(true);
        } else {
            setPedido({ ...pedido, proveedor_id: newProveedorId, renglones: [] });
        }
    };

    const handleConfirmChangeProveedor = () => {
        setPedido({ ...pedido, proveedor_id: pendingProveedorId, renglones: [] });
        setOpenConfirmDialog(false);
        setPendingProveedorId(null);
        setPendingProveedorValue(null);
    };

    const handleCancelChangeProveedor = () => {
        setOpenConfirmDialog(false);
        setPendingProveedorId(null);
        setPendingProveedorValue(null);
        // Revertir la selección del Autocomplete si es necesario
        // Esto se maneja mejor si el Autocomplete tiene un 'value' controlado
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
                    Nuevo Pedido: #{pedido.numero_pedido}
                </Typography>
                <Grid container spacing={2}>
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
                        {proveedores && proveedores.length === 0 ? (
                            <CircularProgress size={24} />
                        ) : (
                            <Autocomplete
                                options={Array.isArray(proveedores) ? proveedores : []}
                                getOptionLabel={(option) => option.nombre}
                                value={proveedores.find(p => p.id === pedido.proveedor_id) || null} // Controlar el valor
                                onChange={handleProveedorChange} // Usar el nuevo handler

                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Proveedor *"
                                        error={!pedido.proveedor_id && !!error}
                                        helperText={!pedido.proveedor_id && error ? error : "Selecciona un proveedor"}
                                    />
                                )}
                                fullWidth
                                sx={{ mb: 3 }}
                            />
                        )}
                    </Grid>
                </Grid>

                {/* Sección de Productos Disponibles (solo visible si hay proveedor) */}
                {pedido.proveedor_id && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Productos de {proveedores.find(p => p.id === pedido.proveedor_id)?.nombre}
                        </Typography>
                        <TextField
                            label="Buscar Producto"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        {loadingProductos ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell sx={{ width: '120px' }}>Cantidad</TableCell>
                                            <TableCell sx={{ width: '100px' }}>Acción</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredProductosDisponibles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center">
                                                    No hay productos disponibles o no se encontraron resultados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProductosDisponibles.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2">{product.nombre}</Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                ${product.precio_unitario?.toFixed(2)}
                                                            </Typography>
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <TextField
                                                            type="number"
                                                            value={availableProductQuantities[product.id] || 1}
                                                            onChange={(e) =>
                                                                handleAvailableProductQuantityChange(product.id, e.target.value)
                                                            }
                                                            size="small"
                                                            inputProps={{ min: 1, step: 1 }}
                                                            sx={{ width: '80px' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleAddProductToOrder(product)}
                                                            disabled={!availableProductQuantities[product.id] || availableProductQuantities[product.id] <= 0}
                                                        >
                                                            <AddCircleIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}

                {/* Sección de Productos en el Pedido (renglones) */}
                {pedido.renglones.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Pedido
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Producto</TableCell>
                                        <TableCell>Cantidad</TableCell>
                                        <TableCell>Subtotal</TableCell>
                                        <TableCell>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pedido.renglones.map((renglon, index) => (
                                        <TableRow key={renglon.producto_id || index}>
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Typography variant="body2">{renglon.nombre_producto}</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        ${renglon.precio_unitario?.toFixed(2)}
                                                    </Typography>
                                                </Stack>
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
                    </Box>
                )}

                <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                    Total: ${pedido.renglones
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

            {/* Diálogo de Confirmación */}
            <Dialog
                open={openConfirmDialog}
                onClose={handleCancelChangeProveedor}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Cambiar Proveedor"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Si cambias el proveedor, se limpiará el pedido actual. ¿Deseas continuar?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelChangeProveedor} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmChangeProveedor} color="primary" autoFocus>
                        Continuar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
