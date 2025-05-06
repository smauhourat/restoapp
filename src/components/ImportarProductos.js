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
    Container
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ImportarProductos() {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleFileUpload = async (e) => {
        e.preventDefault();

        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('archivo', file);
        try {
            const response = await fetch('http://localhost:3001/api/productos/importar', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setPreviewData(data.data);
            console.log('previewData =>', data.data)
        } catch (error) {
            alert('Error al procesar el archivo: ' + error.message);
            console.log(`Error al procesar el archivo: ${error}`)
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/productos/confirmar-importacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productos: previewData }),
            });
            const result = await response.json();
            alert(`¡Éxito! Se importaron ${result.imported} productos`);
            setPreviewData(null);
            setFile(null);
        } catch (error) {
            alert('Error al guardar: ' + error.message);
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