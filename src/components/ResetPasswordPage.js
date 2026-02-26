import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useThemeMode } from '../context/ThemeModeContext';
import apiClient from '../api/client';

export default function ResetPasswordPage() {
    const { token }               = useParams();
    const navigate                = useNavigate();
    const { mode }                = useThemeMode();
    const isDark                  = mode === 'dark';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm]   = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [exito, setExito]       = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await apiClient.post('/auth/reset-password', { token, password });
            setExito(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err?.response?.data?.error || 'Error al restablecer la contraseña.');
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
                        Nueva contraseña
                    </Typography>

                    {exito ? (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            ¡Contraseña actualizada! Redirigiendo al inicio de sesión...
                        </Alert>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                label="Nueva contraseña"
                                type={showPwd ? 'text' : 'password'}
                                fullWidth
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                margin="normal"
                                autoFocus
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPwd((s) => !s)}
                                                edge="end"
                                            >
                                                {showPwd ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                label="Confirmar contraseña"
                                type="password"
                                fullWidth
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                margin="normal"
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ mt: 3 }}
                            >
                                {loading
                                    ? <CircularProgress size={24} color="inherit" />
                                    : 'Restablecer contraseña'}
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
