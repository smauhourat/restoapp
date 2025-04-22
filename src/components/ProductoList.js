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
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ProductoList() {
    const [productos, setProductos] = useState([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProductos();
    }, []);

    const fetchProductos = () => {
        fetch('http://localhost:3001/api/productos')
            .then((res) => res.json())
            .then(setProductos)
            .catch((err) => setError('Error al cargar productos'));
    };

    const handleDelete = (id) => {
        fetch(`http://localhost:3001/api/productos/${id}`, { method: 'DELETE' })
            .then((res) => {
                if (res.ok) {
                    fetchProductos();
                } else {
                    return res.json().then((err) => { throw new Error(err.error); });
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setOpenDeleteDialog(false));
    };

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
                sx={{ mb: 3 }}
            >
                Nuevo Producto
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Precio Unitario</TableCell>
                            <TableCell>Unidad de Medida</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productos.map((producto) => (
                            <TableRow key={producto.id}>
                                <TableCell>{producto.nombre}</TableCell>
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