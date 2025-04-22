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
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function PedidoForm() {
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [pedido, setPedido] = useState({
        numero_pedido: `PED-${Date.now()}`,
        fecha: new Date().toISOString().split('T')[0],
        proveedor_id: null,
        renglones: [],
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3001/api/proveedores')
            .then((res) => res.json())
            .then(setProveedores);

        fetch('http://localhost:3001/api/productos')
            .then((res) => res.json())
            .then(setProductos);
    }, []);

    const handleAddRenglon = () => {
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

    const handleSubmit = () => {
        if (!pedido.proveedor_id || pedido.renglones.length === 0) {
            setError('Completa todos los campos requeridos');
            return;
        }

        fetch('http://localhost:3001/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedido),
        })
            .then(() => navigate('/pedidos'))
            .catch((err) => setError('Error al guardar pedido'));
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
                        <TextField
                            label="Número de Pedido"
                            fullWidth
                            value={pedido.numero_pedido}
                            disabled
                        />
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
                        <Autocomplete
                            options={proveedores}
                            getOptionLabel={(option) => option.nombre}
                            onChange={(e, value) => setPedido({ ...pedido, proveedor_id: value?.id })}
                            renderInput={(params) => (
                                <TextField {...params} label="Proveedor" required />
                            )}
                        />
                    </Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    Productos
                </Typography>
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
                                            options={productos}
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