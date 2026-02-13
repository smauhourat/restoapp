import { useTheme, useMediaQuery } from '@mui/material';
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
    TableSortLabel,
    Tooltip,
    TextField,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { amber } from '@mui/material/colors';


import productService from '../services/productoServices';

const colorAlert = amber[100];

const LOCALSTORAGE_KEY = 'productosPerPage';

export default function ProductoList() {
    const [productos, setProductos] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);

    const [perPage, setPerPage] = useState(() => {
        const saved = localStorage.getItem(LOCALSTORAGE_KEY);
        return saved ? parseInt(saved) : 10;
    });
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [productoToDelete, setProductoToDelete] = useState(null);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [sortConfig, setSortConfig] = useState({
        key: 'nombre',
        direction: 'asc',
    });
    const [openProveedoresDialog, setOpenProveedoresDialog] = useState(false);
    const [proveedoresList, setProveedoresList] = useState([]);
    const [proveedorProductoLoading, setProveedorProductoLoading] = useState(false);
    const navigate = useNavigate();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));


    useEffect(() => {
        if (searchTerm) {
            // Si hay término de búsqueda, buscar con paginación
            handleSearch(searchTerm, page, perPage);
        } else {
            // Si no hay búsqueda, cargar productos normales con paginación
            fetchProductos();
        }
    }, [page, perPage, sortConfig]);


    useEffect(() => {
        localStorage.setItem(LOCALSTORAGE_KEY, perPage.toString());
    }, [perPage]);

    const fetchProductos = async () => {
        try {
            const { data, totalPages, total } = await productService.getAll(
                page,
                perPage,
                sortConfig.key,
                sortConfig.direction
            );
            setProductos(data);
            setTotalPages(totalPages);
            setTotalCount(total);
        } catch (error) {
            setError('Error al cargar los productos');
            console.error(error);
        }
    };

    // Función para buscar en toda la base de datos con paginación
    const handleSearch = async (term, currentPage = 1, itemsPerPage = perPage) => {
        if (term.trim() === '') {
            // Si el término está vacío, volver a la vista normal
            setSearchTerm('');
            setPage(1);
            fetchProductos();
            return;
        }

        setIsSearching(true);
        try {
            // Llamar al servicio que busca en toda la base de datos con paginación


            const { data, totalPages, total } = await productService.getAll(
                currentPage,
                itemsPerPage,
                sortConfig.key,
                sortConfig.direction,
                term
            );
            setProductos(data);

            setTotalPages(totalPages);
            setTotalCount(total);
            setSearchTerm(term);
            setPage(currentPage);
        } catch (error) {
            setError('Error al buscar productos');
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // Manejar cambio en el campo de búsqueda (solo actualiza el estado)
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Manejar la tecla ENTER para ejecutar la búsqueda
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            setPage(1); // Reiniciar a la primera página al buscar
            handleSearch(searchTerm, 1, perPage);
        }
    };

    // Limpiar búsqueda y volver a la vista normal
    const clearSearch = () => {
        setSearchTerm('');
        setPage(1);
        fetchProductos();
    };

    // Cambiar página
    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    // Cambiar items por página
    const handlePerPageChange = (event) => {
        const newPerPage = event.target.value;
        setPerPage(newPerPage);
        setPage(1); // Reiniciar a la primera página

        if (searchTerm) {
            handleSearch(searchTerm, 1, newPerPage);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setPage(1);
    };

    const handleDelete = async (id) => {
        try {
            await productService.delete(id);
            // Recargar los datos después de eliminar
            if (searchTerm) {
                handleSearch(searchTerm, page, perPage);
            } else {
                fetchProductos();
            }
            setOpenDeleteDialog(false);
        } catch (error) {
            setError('Error al eliminar el producto');
            console.error(error);
        }
    };

    const handleVerProveedores = async (productoId) => {
        setProveedorProductoLoading(true);
        try {
            const proveedores = await productService.getProveedoresByProductoId(productoId);
            console.log('Proveedores del producto:', proveedores);
            setProveedoresList(proveedores);
        } catch (error) {
            setError('Error al cargar los proveedores');
            console.error(error);
        } finally {
            setOpenProveedoresDialog(true);
            setProveedorProductoLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Productos
            </Typography>

            {/* Barra de búsqueda */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TextField
                    fullWidth
                    placeholder="Buscar productos por nombre o descripción...(presione Enter para buscar)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}

                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                {isSearching ? (
                                    <CircularProgress size={20} />
                                ) : searchTerm ? (
                                    <IconButton
                                        aria-label="limpiar búsqueda"
                                        onClick={clearSearch}
                                        edge="end"
                                        size="small"
                                    >
                                        <ClearIcon />
                                    </IconButton>
                                ) : null}
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Button
                component={Link}
                to="/productos/nuevo"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mb: 3, mr: 3 }}
            >
                {isMobile ? 'Nuevo' : 'Nuevo Producto'}
            </Button>
            <Button
                component={Link}
                to="/productos/importar"
                variant="contained"
                color="success"
                startIcon={<FileUploadIcon />}
                sx={{ mb: 3 }}
            >
                {isMobile ? 'Importar' : 'Importar Productos'}
            </Button>

            {/* Información de resultados */}
            {searchTerm && (
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    {isSearching ? 'Buscando...' : `Mostrando ${productos.length} de ${totalCount} resultados para "${searchTerm}"`}
                </Typography>
            )}

            <TableContainer component={Paper}>
                <Table size="small">
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
                            {!isMobile ? (
                                <>
                                    <TableCell>#Proveedores</TableCell>
                                    <TableCell align="right">Precio Promedio</TableCell>
                                    <TableCell>Unidad de Medida</TableCell>
                                </>) : null}
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
                        {isSearching ? (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : 6} align="center">
                                    <CircularProgress />
                                    <Typography variant="body2" sx={{ mt: 1 }}>Buscando...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : productos.length > 0 ? (
                            productos.map((producto) => (
                                <TableRow key={producto.id}>
                                    <TableCell>
                                        <Stack spacing={0.5}>
                                            <Typography variant="body2">{producto.nombre}</Typography>
                                            {isMobile ? (<>
                                                <Typography variant="caption" color="textSecondary">
                                                    ${producto.precio_promedio?.toFixed(2)} | {producto.unidad_medida}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ ...(producto.proveedores === 0 && { backgroundColor: colorAlert }) }} >

                                                    <Tooltip title="Cantidad de Proveedores" arrow>
                                                        {producto.proveedores} Proveedores
                                                    </Tooltip>
                                                </Typography>
                                            </>) : null}
                                        </Stack>
                                    </TableCell>
                                    {!isMobile ? (<>
                                        <TableCell sx={{
                                            ...(producto.proveedores === 0 && { backgroundColor: colorAlert }),
                                            cursor: producto.proveedores > 0 ? 'pointer' : 'default',
                                            '&:hover': producto.proveedores > 0 ? { backgroundColor: 'action.hover' } : {}
                                        }}
                                        onClick={() => producto.proveedores > 0 && handleVerProveedores(producto.id)}
                                        >
                                            <Tooltip title={producto.proveedores > 0 ? 'Ver proveedores' : 'Sin proveedores'} arrow>
                                                <span>{producto.proveedores}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right"><Tooltip title="Es el precio promedio entre todos los Proveedores" arrow> {producto.precio_promedio ? `$${producto.precio_promedio}` : ''}</Tooltip></TableCell>
                                        <TableCell>{producto.unidad_medida}</TableCell>
                                    </>) : null}


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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : 6} align="center">
                                    {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos disponibles'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Mostrar paginación siempre */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Typography>Filas por página:</Typography>
                        <Select
                            value={perPage}
                            onChange={handlePerPageChange}
                            size="small"
                            sx={{ width: 80 }}
                        >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                        </Select>
                        <Typography>
                            Total: {totalCount} productos
                        </Typography>
                    </Stack>

                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}

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

            {/* Dialogo para ver proveedores del producto */}
            <Dialog
                open={openProveedoresDialog}
                onClose={() => setOpenProveedoresDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Proveedores del Producto</DialogTitle>
                <DialogContent>
                    {proveedorProductoLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : proveedoresList?.length > 0 ? (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nombre</TableCell>
                                        <TableCell>Teléfono</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell align="right">Precio</TableCell>
                                        <TableCell align="right">Tiempo Entrega</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {proveedoresList.map((proveedor) => (
                                        <TableRow key={proveedor.id}>
                                            <TableCell>{proveedor.nombre}</TableCell>
                                            <TableCell>{proveedor.telefono || '-'}</TableCell>
                                            <TableCell>{proveedor.email || '-'}</TableCell>
                                            <TableCell align="right">${proveedor.precio_unitario?.toFixed(2)}</TableCell>
                                            <TableCell align="right">{proveedor.tiempo_entrega ? `${proveedor.tiempo_entrega} días` : '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Este producto no tiene proveedores asignados
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProveedoresDialog(false)}>Cerrar</Button>
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
        </Container>
    );
}