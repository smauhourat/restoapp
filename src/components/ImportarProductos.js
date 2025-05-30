import { useState } from 'react';
import {
    Button,
    Typography,
    Box,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Container,
    Snackbar,
    Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import apiClient from '../api/client';

export default function ImportarProductos() {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileUpload = async (e) => {
        e.preventDefault();

        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            const response = await apiClient.post('productos/importar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            const data = await response.data;
            setPreviewData(data)
        } catch (error) {
            setMessage('Error al procesar el archivo: ' + error.message);
            console.log(`Error al procesar el archivo: ${error}`)
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.post('/productos/confirmar-importacion', JSON.stringify({ productos: previewData }))
            setMessage(`¡Éxito! Se importaron ${response.imported} productos`);
            setPreviewData(null);
            setFile(null);
        } catch (error) {
            setMessage('Error al guardar: ' + error.message);
        } finally {
            setIsLoading(false);
            setConfirmOpen(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                Importar Productos desde Excel
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb:3 }}>
                El Archivo deberá tener las siguientes columnas: nombre, descripcion, precio, unidad:
            </Typography>

            {/* <Box component="form" onSubmit={handleFileUpload} sx={{ mb: 3 }}> */}
            <Box component="form" sx={{ mb: 3 }}>
                <input
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    id="upload-excel"
                    type="file"
                    onChange={(e) => 
                        {
                            setFile(e.target.files[0])
                            setPreviewData(null)
                        }
                    }
                />

                <label htmlFor="upload-excel">
                    <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mr: 2 }}
                    >
                        Seleccionar Archivo
                    </Button>
                </label>

                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!file || isLoading}
                    onClick={(e) => handleFileUpload(e)}
                    startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                    Previsualizar
                </Button>

                {file && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Archivo seleccionado: {file.name}
                    </Typography>
                )}
            </Box>

            <Snackbar
                open={!!message}
                autoHideDuration={6000}
                onClose={() => setMessage('')}
            >
                <Alert severity="info" onClose={() => setMessage('')}>
                    {message}
                </Alert>
            </Snackbar>
            {/* Tabla de previsualización */}
            {previewData && (
                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Previsualización ({previewData.length} productos)
                    </Typography>

                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell>Precio</TableCell>
                                    <TableCell>Unidad</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {previewData.map((producto, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{producto.nombre}</TableCell>
                                        <TableCell>{producto.descripcion}</TableCell>
                                        <TableCell>${producto.precio.toFixed(2)}</TableCell>
                                        <TableCell>{producto.unidad}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => setConfirmOpen(true)}
                    >
                        Confirmar Importación
                    </Button>
                </Box>
            )}

            {/* Diálogo de confirmación */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle>Confirmar Importación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de importar {previewData?.length || 0} productos a la base de datos?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleConfirmImport}
                        color="primary"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    >
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}