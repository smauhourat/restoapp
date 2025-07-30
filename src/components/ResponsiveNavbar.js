import { useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Container } from '@mui/material';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import logo from './../logo.png'; 

export default function ResponsiveNavbar() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Función para cerrar el menú al seleccionar un ítem
    const handleCloseMobileMenu = () => {
        setMobileOpen(false);
    };

    return (
        <AppBar position="static">
            <Container maxWidth="xl">
            <Toolbar >
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                        <Link to="/">
                            <img
                                src={logo}
                                alt="Logo"
                                style={{ height: '45px', paddingTop: '5px', paddingBottom: '5px' }}
                            />
                        </Link>
                    </Typography>
                </Box>

                {isMobile ? (
                    <IconButton
                        color="inherit"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <MenuIcon />
                    </IconButton>
                ) : (
                    <Box sx={{ display: 'flex' }}>
                        <Button
                            component={Link}
                            to="/proveedores"
                            color="inherit"
                            sx={{ mx: 1 }}
                                onClick={handleCloseMobileMenu}
                        >
                            Proveedores
                        </Button>
                        <Button
                            component={Link}
                            to="/productos"
                            color="inherit"
                            sx={{ mx: 1 }}
                                onClick={handleCloseMobileMenu}
                        >
                            Productos
                        </Button>
                        <Button
                            component={Link}
                            to="/pedidos"
                            color="inherit"
                            sx={{ mx: 1 }}
                                onClick={handleCloseMobileMenu}
                        >
                            Pedidos
                        </Button>
                        {/* <Button
                            component={Link}
                            to="/suppliers"
                            color="inherit"
                            sx={{ mx: 1 }}
                            onClick={handleCloseMobileMenu}
                        >
                            Suppliers
                        </Button>                         */}
                    </Box>
                )}
            </Toolbar>
            </Container>
            {/* Menú desplegable para móviles */}
            {isMobile && mobileOpen && (
                <Drawer
                    anchor="right"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                >
                    <List>
                        {['Proveedores', 'Productos', 'Pedidos'].map((text) => (
                            <ListItem
                                button
                                key={text}
                                component={Link}
                                to={`/${text.toLowerCase()}`}
                                onClick={handleCloseMobileMenu}
                            >
                                <ListItemText primary={text} sx={{ color: "#000000"}} />
                            </ListItem>
                        ))}
                    </List>
                </Drawer>                
                // <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                //     <Button
                //         component={Link}
                //         to="/proveedores"
                //         color="inherit"
                //         sx={{ mx: 1 }}
                //     >
                //         Proveedores
                //     </Button>                    
                //     <Button
                //         component={Link}
                //         to="/productos"
                //         color="inherit"
                //         sx={{ mx: 1 }}
                //     >
                //         Productos
                //     </Button>
                //     <Button
                //         component={Link}
                //         to="/pedidos"
                //         color="inherit"
                //         sx={{ mx: 1 }}
                //     >
                //         Pedidos
                //     </Button>

                // </Box>
            )}
        </AppBar>
    );
}