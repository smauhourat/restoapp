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
    IconButton,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    Select,
    Box,
    Pagination,
    Stack,
    TableSortLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import apiClient from '../api/client';

// Clave para el localStorage
const LOCALSTORAGE_KEY = 'productosPerPage';

export default function ProductoList() {
    const [productos, setProductos] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    // Recuperar el valor guardado o usar 10 por defecto
    const [perPage, setPerPage] = useState(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    return saved ? parseInt(saved) : 10;
    });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const [error, setError] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'nombre', // Campo por defecto
        direction: 'asc', // 'asc' o 'desc'
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProductos();
    }, [page, perPage, sortConfig]);

    // Guardar en localStorage cuando cambie
    useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, perPage.toString());
    }, [perPage]);    

    const fetchProductos = async () => {
        const { data, totalPages } = await apiClient.get('/productos', {
            params: { page, perPage, sortBy: sortConfig.key, order: sortConfig.direction }
        });
        
        setProductos(data)
        setTotalPages(totalPages);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setPage(1)
    };    

    const handleDelete = async (id) => {
        await apiClient.delete(`/productos/${id}`)
        fetchProductos(productos.filter((p) => p.id !== id))
        setOpenDeleteDialog(false)
    }    

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Productos
            </Typography>
            <Button
                component={Link}
                to="/productos/nuevo"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 3, mr: 3 }}
            >
                Nuevo Producto
            </Button>
            <Button
                component={Link}
                to="/productos/importar"
                variant="contained"
                color="success"
                startIcon={<FileUploadIcon />}
                sx={{ mb: 3 }}
            >
                Importar Productos
            </Button>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.key === 'nombre'}
                                    direction={sortConfig.direction}
                                    onClick={() => handleSort('nombre')}
                                >
                                    Nombre
                                </TableSortLabel>                                
                            </TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell>Precio Unitario</TableCell>
                            <TableCell>Unidad de Medida</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortConfig.key === 'descripcion'}
                                    direction={sortConfig.direction}
                                    onClick={() => handleSort('descripcion')}
                                >
                                    Descripción
                                </TableSortLabel>                                
                            </TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productos.map((producto) => (
                            <TableRow key={producto.id}>
                                <TableCell>{producto.nombre}</TableCell>
                                <TableCell>{producto.proveedor}</TableCell>
                                <TableCell>${producto.precio_unitario}</TableCell>
                                <TableCell>{producto.unidad_medida}</TableCell>
                                <TableCell>{producto.descripcion}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        color="primary"
                                        onClick={() => navigate(`/productos/editar/${producto.id}`)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        color="error"
                                        onClick={() => {
                                            setProductoToDelete(producto.id);
                                            setOpenDeleteDialog(true);
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
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
            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>¿Eliminar producto?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Esta acción no se puede deshacer. ¿Estás seguro?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button
                        onClick={() => handleDelete(productoToDelete)}
                        color="error"
                        autoFocus
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notificación de error */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            </Snackbar>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                sx={{ mt: 2 }}
                onClick={() => navigate('/')} // Vuelve a la Home
            >
                Volver atrás
            </Button>      

        </Container>
    );
}