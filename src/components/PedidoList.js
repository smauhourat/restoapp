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
    Box,
    Pagination,
    Stack,
    Tooltip

} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

import apiClient from '../api/client';

// Clave para el localStorage
const LOCALSTORAGE_KEY = 'pedidosPerPage';


const ESTADOS = {
    pendiente: { color: 'warning', label: 'Pendiente' },
    enviado: { color: 'info', label: 'Enviado' },
    recibido: { color: 'success', label: 'Recibido' },
    cancelado: { color: 'error', label: 'Cancelado' },
};

export default function PedidoList() {
    const [pedidos, setPedidos] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    // Recuperar el valor guardado o usar 10 por defecto
    const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    return saved ? parseInt(saved) : 10;
  });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchPedidos();
    }, [page, perPage]);

    // Guardar en localStorage cuando cambie
    useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, perPage.toString());
    }, [perPage]);

    const fetchPedidos = async () => {
        const { data, totalPages } = await apiClient.get('/pedidos', {
            params: { page, perPage }
        });
        setPedidos(data)
        setTotalPages(totalPages);
    };

    const handleEstadoChange = async (pedidoId, nuevoEstado) => {
        await apiClient.patch(`/pedidos/${pedidoId}/estado`, JSON.stringify({ estado: nuevoEstado }))
        await fetchPedidos()
    }

    const getBackCoor = (estado) => {
        switch (estado) {
            case 'pendiente':
                return "#f8d7da80"
            case 'enviado':
                return "#fff3cd80"
            case 'recibido':
                return "#d4edda80"
            default:
                return ""
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
                <Table size="small">
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
                                    <Tooltip title="Ver Detalle" arrow>
                                        <Button
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => navigate(`/pedidos/${pedido.id}`)}
                                            >
                                        </Button>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Paginación y controles */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                <Typography>Filas por página:</Typography>
                <Select
                    value={perPage}
                    onChange={(e) => setPerPage(e.target.value)}
                    size="small"
                    sx={{ width: 80 }}
                >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                </Select>
                </Stack>

                <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
                />
            </Box>      

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                <Alert severity="error">{error}</Alert>
            </Snackbar>
        </Container>
    );
}