import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    Link,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import logo from './../logo.png';
import logodark from './../logo-dark.png';

export default function LoginPage() {
    const { login } = useAuth();
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch {
            setError('Email o contraseña incorrectos');
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <img
                            src={isDark ? logo : logodark}
                            alt="Logo"
                            style={{ height: '60px' }}
                        />
                    </Box>

                    <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                        Iniciar sesión
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
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
                        <TextField
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            fullWidth
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            autoComplete="current-password"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            sx={{ mt: 3 }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Link component={RouterLink} to="/forgot-password" variant="body2">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}
