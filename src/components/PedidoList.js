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
    MenuItem,
    Select,
    Snackbar,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

import apiClient from '../api/client';

const ESTADOS = {
    pendiente: { color: 'warning', label: 'Pendiente' },
    enviado: { color: 'info', label: 'Enviado' },
    recibido: { color: 'success', label: 'Recibido' },
    cancelado: { color: 'error', label: 'Cancelado' },
};

export default function PedidoList() {
    const [pedidos, setPedidos] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPedidos();
    }, []);

    const fetchPedidos = async () => {
        try {
            const data = await apiClient.get('/pedidos')
            setPedidos(data)
        } catch (err) {
            setError('Error al cargar pedidos');
        }
    };

    const handleEstadoChange = async (pedidoId, nuevoEstado) => {
        try {
            await apiClient.patch(`/pedidos/${pedidoId}/estado`, JSON.stringify({ estado: nuevoEstado }))
            await fetchPedidos()
        } catch (err) {
            setError('Error al actualizar estado');
        }
    }

    const getBackCoor = (estado) => {
        switch (estado) {
            case 'pendiente':
                return "#f8d7da80"
            case 'enviado':
                return "#fff3cd80"
            case 'recibido':
                return "#d4edda80"
        }
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Pedidos
            </Typography>
            <Button
                component={Link}
                to="/pedidos/nuevo"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 3 }}
            >
                Nuevo Pedido
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Número</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pedidos.map((pedido) => (
                            <TableRow key={pedido.id} sx={{
                                backgroundColor: getBackCoor(pedido.estado)
                            }}>
                                <TableCell>{pedido.numero_pedido}</TableCell>
                                <TableCell>{new Date(pedido.fecha).toLocaleDateString()}</TableCell>
                                <TableCell>{pedido.proveedor}</TableCell>
                                <TableCell>${pedido.total.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Select
                                        value={pedido.estado}
                                        onChange={(e) => handleEstadoChange(pedido.id, e.target.value)}
                                        size="small"
                                        sx={{ minWidth: 120 }}
                                    >
                                        {Object.keys(ESTADOS).map((estado) => (
                                            <MenuItem key={estado} value={estado}>
                                                {ESTADOS[estado].label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => navigate(`/pedidos/${pedido.id}`)}
                                    >
                                        Detalles
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}