import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Link,
} from '@mui/material';
import { useThemeMode } from '../context/ThemeModeContext';
import apiClient from '../api/client';

export default function ForgotPasswordPage() {
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    const [email, setEmail]     = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [enviado, setEnviado] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/auth/forgot-password', { email });
            setEnviado(true);
        } catch {
            setError('Error al procesar la solicitud. Intentá más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isDark
                    ? 'linear-gradient(135deg, #0f172a 0%, #0b253a 100%)'
                    : 'linear-gradient(135deg, #f4fbfd 0%, #e8f4f8 100%)',
                px: 2,
            }}
        >
            <Card
                elevation={isDark ? 0 : 3}
                sx={{
                    width: '100%',
                    maxWidth: 400,
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                        Recuperar contraseña
                    </Typography>

                    {enviado ? (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            Si el email está registrado, recibirás un enlace en los próximos minutos.
                            Revisá también la carpeta de spam.
                        </Alert>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
                            </Typography>

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                margin="normal"
                                autoComplete="email"
                                autoFocus
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ mt: 3 }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar enlace'}
                            </Button>
                        </Box>
                    )}

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            Volver al inicio de sesión
                        </Link>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
