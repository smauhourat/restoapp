import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    Divider,
    Grid,
    Box,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Breadcrumbs,
    Link
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import WhatsAppIcon from '@mui/icons-material/WhatsApp'; // Importar el icono
import QrCodeIcon from '@mui/icons-material/QrCode';

import { QRCodeSVG } from 'qrcode.react';
import Dialog from '@mui/material/Dialog';

import apiClient from '../api/client';

const ESTADOS = {
    pendiente: { color: 'warning', label: 'Pendiente' },
    enviado: { color: 'info', label: 'Enviado' },
    recibido: { color: 'success', label: 'Recibido' },
    cancelado: { color: 'error', label: 'Cancelado' },
};



export default function PedidoDetalle() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pedido, setPedido] = useState(null);
    const [error, setError] = useState('');

    // Estado para el diálogo de QR
    const [qrOpen, setQrOpen] = useState(false);
    const [qrContent, setQrContent] = useState('');

    useEffect(() => {
        fetchPedidoDetalle()
    }, [id]);

    const fetchPedidoDetalle = async () => {
        const data = await apiClient.get(`/pedidos/${id}`)
        setPedido(data)
    }

    const generateQR = async () => {
        const itemsText = pedido.renglones.map((item, i) =>
            `${i + 1}.   ${item.cantidad} ${item.producto_nombre}`
        ).join('\n'); // %0A es el código para salto de línea en URLs        
        const content = `Pedido #${pedido.numero_pedido}\nProveedor: ${pedido.proveedor_nombre}\n${itemsText}\nTotal: $${pedido.total.toFixed(2)}`;
        setQrContent(content);
        setQrOpen(true);

        // Registrar generación de QR en el historial
        await apiClient.post(`/pedidos/${id}/envios`, JSON.stringify({ metodo_envio: 'qr', destinatario: 'Generado para compartir' }))
    };

    const saveHistorialEnvioWsp = async () => {
        // Registrar generación de mensaje para WhatsApp en el historial
        await apiClient.post(`/pedidos/${id}/envios`, JSON.stringify({ metodo_envio: 'wsp', destinatario: 'Generado para enviar' }))
    }

    // Función para generar el mensaje de WhatsApp
    const generateWhatsAppMessage = () => {
        // const itemsText = pedido.renglones.map(item =>
        //     `- ${item.producto_nombre}: ${item.cantidad} x $${item.precio_unitario} = $${(item.cantidad * item.precio_unitario).toFixed(2)}`
        // ).join('%0A'); // %0A es el código para salto de línea en URLs

        const itemsText = pedido.renglones.map((item, i) =>
            `${i+1}.   ${item.cantidad} ${item.producto_nombre}`
        ).join('\n'); // %0A es el código para salto de línea en URLs


        let msg = "*Sapori d’Italia*\n"
        msg += `*Nro. Pedido*: ${pedido.numero_pedido}\n`
        msg += `*Proveedor*: ${pedido.proveedor_nombre}\n`
        msg += `*Fecha*: ${new Date(pedido.fecha).toLocaleDateString()}\n`
        msg += `*Detalle*\n`
        msg += `${itemsText}`

        return `https://wa.me/1136801621?text=` + encodeURIComponent(msg).replace(/\s+/g, ' '); // Elimina espacios múltiples
   
        // return `https://wa.me/${pedido.proveedor_telefono}?text=` + encodeURIComponent(`
        //         *Nuevo Pedido*: ${pedido.numero_pedido}
        //         *Proveedor*: ${pedido.proveedor_nombre}
        //         *Fecha*: ${new Date(pedido.fecha).toLocaleDateString()}
        //         *Estado*: ${ESTADOS[pedido.estado].label}
        //         %0A%0A*Detalle*:%0A${itemsText}
        //         %0A%0A*Total*: $${pedido.total.toFixed(2)}
        //         %0A%0APor favor confirmar recepción.
        //         `).replace(/\s+/g, ' '); // Elimina espacios múltiples
    };

    if (!pedido) return <Typography>Cargando...</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs aria-label="ruta" gutterBottom>
                <Button
                    variant="text" // O "outlined", "text"
                    startIcon={<ArrowBackIosIcon />} // Usa startIcon para el icono a la izquierda
                    onClick={() => navigate('/pedidos')}
                >
                    VOLVER
                </Button>                 
            </Breadcrumbs>
            <Paper elevation={3} sx={{ p: 4 }}>
                {/* Cabecera del Pedido */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4" gutterBottom>
                            Pedido #{pedido.numero_pedido}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            <strong>Proveedor:</strong> {pedido.proveedor_nombre}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: 'right' }}>
                        <Chip
                            label={ESTADOS[pedido.estado]?.label || pedido.estado}
                            color={ESTADOS[pedido.estado]?.color || 'default'}
                            sx={{ fontSize: '1rem', p: 2, mb: 2 }}
                        />
                        <Typography variant="h5">
                            <strong>Total:</strong> ${pedido.total?.toFixed(2)}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Renglones del Pedido */}
                <Typography variant="h6" gutterBottom>
                    Detalle del Pedido
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Producto</TableCell>
                                <TableCell align="right">Cantidad</TableCell>
                                <TableCell align="right">Precio Unitario</TableCell>
                                <TableCell align="right">Subtotal</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedido.renglones.map((renglon, index) => (
                                <TableRow key={index}>
                                    <TableCell>{renglon.producto_nombre}</TableCell>
                                    <TableCell align="right">{renglon.cantidad}</TableCell>
                                    <TableCell align="right">${renglon.precio_unitario?.toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        ${(renglon.cantidad * renglon.precio_unitario)?.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Acciones */}
                <Box sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Tooltip title="Imprimir" arrow>
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Imprimir</Box>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Enviar por Email" arrow>
                        <Button
                            variant="contained"
                            color="secondary"
                            disabled={pedido.estado === 'cancelado'}
                            startIcon={<EmailIcon />}
                            onClick={() => alert('Enviar email al proveedor...')}
                            >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Enviar por Email</Box>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Enviar por WhatsApp" arrow>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<WhatsAppIcon />}
                            onClick={() => { 
                                saveHistorialEnvioWsp()
                                window.open(generateWhatsAppMessage(), '_blank')
                            }}
                            disabled={!!pedido.proveedor_telefono || pedido.estado === 'cancelado'}
                            >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Enviar por WhatsApp</Box>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Generar QR" arrow>
                        <Button
                            variant="contained"
                            color="info"
                            disabled={pedido.estado === 'cancelado'}
                            startIcon={<QrCodeIcon />}
                            onClick={generateQR}
                            >
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Generar QR</Box>
                        </Button>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Diálogo para mostrar QR */}
            <Dialog open={qrOpen} onClose={() => setQrOpen(false)}>
                <DialogTitle>Compartir Pedido</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', p: 4 }}>
                    <QRCodeSVG
                        value={qrContent}
                        size={256}
                        level="H"
                        includeMargin
                    />
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        Escanear para ver detalles del pedido
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setQrOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>            
        </Container>
    );
}