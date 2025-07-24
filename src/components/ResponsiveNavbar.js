import { useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Toolbar, Button, Box, IconButton } from '@mui/material';
import { useState } from 'react';
import logo from './../logo.png'; 

export default function ResponsiveNavbar() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <AppBar position="static">
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Box
                    component="img"
                    src={logo}
                    alt="Logo de la empresa"
                    sx={{
                        height: 40, // Ajusta según necesites
                        mr: 2 // Margen a la derecha
                    }}
                />  

                {isMobile ? (
                    <IconButton
                        color="inherit"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <MenuIcon />
                    </IconButton>
                ) : (
                    <Box sx={{ display: 'flex' }}>
                        {/* Mismos botones del ejemplo anterior */}
                    </Box>
                )}
            </Toolbar>

            {/* Menú desplegable para móviles */}
            {isMobile && mobileOpen && (
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                    <Button href="/productos" fullWidth sx={{ my: 1 }}>
                        Productos
                    </Button>
                    <Button href="/servicios" fullWidth sx={{ my: 1 }}>
                        Servicios
                    </Button>
                    <Button
                        variant="contained"
                        href="/contacto"
                        fullWidth
                        sx={{ my: 1 }}
                    >
                        Contacto
                    </Button>
                </Box>
            )}
        </AppBar>
    );
}