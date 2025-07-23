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
    Box, // Importar Box para layout
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import apiClient from '../api/client';

export default function PedidoForm() {
    const [proveedores, setProveedores] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para el buscador
    const [availableProductQuantities, setAvailableProductQuantities] = useState({}); // Nuevo estado para cantidades de productos disponibles

    const [pedido, setPedido] = useState({
        fecha: new Date().toISOString().split('T')[0],
        proveedor_id: null,
        renglones: [],
        numero_pedido: '', // Inicializar numero_pedido
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
                // Inicializar las cantidades de los productos disponibles a 1
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
            setPedido(prevPedido => ({ ...prevPedido, renglones: [] })); // Limpiar renglones al cambiar de proveedor
        } else {
            setProductosDisponibles([]);
            setAvailableProductQuantities({});
        }
    }, [pedido.proveedor_id]);

    // Filtrar productos disponibles según el término de búsqueda
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
            [productId]: Math.max(1, parseInt(quantity) || 1), // Asegurar que la cantidad sea al menos 1
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
            // Si el producto ya está en el pedido, actualizar la cantidad
            const newRenglones = [...pedido.renglones];
            newRenglones[existingRenglonIndex].cantidad += quantity;
            setPedido({ ...pedido, renglones: newRenglones });
        } else {
            // Si es un producto nuevo, añadirlo al pedido
            setPedido({
                ...pedido,
                renglones: [
                    ...pedido.renglones,
                    {
                        producto_id: product.id,
                        nombre_producto: product.nombre, // Guardar el nombre para mostrarlo
                        cantidad: quantity,
                        precio_unitario: product.precio_unitario,
                    },
                ],
            });
        }
        setError(''); // Limpiar cualquier error previo
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
            return; // El error ya se estableció en checkRenglonesValidos
        }

        addPedido();
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
                        {pedido.numero_pedido ? (
                            <TextField
                                label="Número de Pedido"
                                fullWidth
                                value={pedido.numero_pedido}
                                disabled
                            />
                        ) : (<CircularProgress size={24} />)}
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
                        {proveedores && proveedores.length === 0 ? (
                            <CircularProgress size={24} />
                        ) : (
                            <Autocomplete
                                options={Array.isArray(proveedores) ? proveedores : []}
                                getOptionLabel={(option) => option.nombre}
                                onChange={(e, value) =>
                                    setPedido({ ...pedido, proveedor_id: value?.id || null })
                                }
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
                            Productos Disponibles de {proveedores.find(p => p.id === pedido.proveedor_id)?.nombre}
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
                                            <TableCell>Precio Unitario</TableCell>
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
                                                    <TableCell>{product.nombre}</TableCell>
                                                    <TableCell>${product.precio_unitario?.toFixed(2)}</TableCell>
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
                            Productos en el Pedido
                        </Typography>
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
                                        <TableRow key={renglon.producto_id || index}>
                                            <TableCell>{renglon.nombre_producto}</TableCell>
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
        </Container>
    );
}
