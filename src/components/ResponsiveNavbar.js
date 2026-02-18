import { useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Container,
    Tooltip,
    Drawer,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Avatar,
    Chip,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from './../logo.png';
import logodark from './../logo-dark.png';
import { useThemeMode } from '../context/ThemeModeContext.js';
import { useAuth } from '../context/AuthContext.js';

export default function ResponsiveNavbar() {
    const theme = useTheme();
    const { mode, toggleMode } = useThemeMode();
    const { user, logout } = useAuth();
    const isDark = mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navLinks = [
        { label: 'Proveedores', path: '/proveedores' },
        { label: 'Productos', path: '/productos' },
        { label: 'Pedidos', path: '/pedidos' },
    ];

    const handleCloseMobileMenu = () => {
        setMobileOpen(false);
    };

    const handleLogout = async () => {
        handleCloseMobileMenu();
        await logout();
    };

    const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?';

    return (
        <AppBar
            position="static"
            color="transparent"
            sx={{
                backgroundImage: isDark
                    ? 'linear-gradient(90deg,#0f172a 0%,#0b253a 100%)'
                    : 'linear-gradient(90deg,#ffffff 0%,#f4fbfd 100%)',
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                            <Link to="/">
                                <img
                                    src={isDark ? logo : logodark}
                                    alt="Logo"
                                    style={{ height: '55px', paddingTop: '5px', paddingBottom: '5px' }}
                                />
                            </Link>
                        </Typography>
                    </Box>

                    {isMobile ? (
                        <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
                            <MenuIcon />
                        </IconButton>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {navLinks.map((link) => (
                                    <Button
                                        key={link.path}
                                        component={Link}
                                        to={link.path}
                                        color="inherit"
                                        sx={{ mx: 1 }}
                                        onClick={handleCloseMobileMenu}
                                    >
                                        {link.label}
                                    </Button>
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 3, gap: 1.5 }}>
                                <Typography variant="body1" sx={{ color: '#facc15', mr: 1 }}>
                                    v0.0.2
                                </Typography>
                                <Tooltip title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                                    <IconButton
                                        color="inherit"
                                        onClick={toggleMode}
                                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '50%' }}
                                    >
                                        {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                                    </IconButton>
                                </Tooltip>
                                {user && (
                                    <>
                                        <Tooltip title={`${user.nombre} · ${user.empresa_nombre}`}>
                                            <Chip
                                                avatar={
                                                    <Avatar sx={{ bgcolor: 'primary.main', width: 28, height: 28, fontSize: '0.85rem' }}>
                                                        {userInitial}
                                                    </Avatar>
                                                }
                                                label={user.nombre}
                                                size="small"
                                                variant="outlined"
                                                sx={{ cursor: 'default' }}
                                            />
                                        </Tooltip>
                                        <Tooltip title="Cerrar sesión">
                                            <IconButton
                                                color="inherit"
                                                onClick={handleLogout}
                                                sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '50%' }}
                                            >
                                                <LogoutIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                            </Box>
                        </>
                    )}
                </Toolbar>
            </Container>
            {isMobile && (
                <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
                    <Box sx={{ width: 260 }} role="presentation">
                        {user && (
                            <>
                                <Box sx={{ px: 2, py: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                            {userInitial}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{user.nombre}</Typography>
                                            <Typography variant="caption" color="text.secondary">{user.empresa_nombre}</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Divider />
                            </>
                        )}
                        <List>
                            {navLinks.map((item) => (
                                <ListItemButton
                                    key={item.path}
                                    component={Link}
                                    to={item.path}
                                    onClick={handleCloseMobileMenu}
                                >
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            ))}
                        </List>
                        <Divider sx={{ my: 1 }} />
                        <ListItemButton
                            onClick={() => {
                                toggleMode();
                                handleCloseMobileMenu();
                            }}
                        >
                            <ListItemText
                                primary={isDark ? 'Modo claro' : 'Modo oscuro'}
                                primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                        </ListItemButton>
                        {user && (
                            <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
                                <ListItemText primary="Cerrar sesión" primaryTypographyProps={{ fontWeight: 600 }} />
                                <LogoutIcon fontSize="small" />
                            </ListItemButton>
                        )}
                    </Box>
                </Drawer>
            )}
        </AppBar>
    );
}
