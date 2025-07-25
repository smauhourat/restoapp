import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import logo from './../logo.png'; 

export default function Navbar() {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div">
                            <img
                                src={logo}
                                alt="Logo"
                                style={{ height: '45px' }}
                            />
                        </Typography>
                    </Box>                                   
                    <Button
                        component={Link}
                        to="/proveedores"
                        color="inherit"
                        sx={{ mx: 1 }}
                    >
                        Proveedores
                    </Button>
                    <Button
                        component={Link}
                        to="/productos"
                        color="inherit"
                        sx={{ mx: 1 }}
                    >
                        Productos
                    </Button>
                    <Button
                        component={Link}
                        to="/pedidos"
                        color="inherit"
                        sx={{ mx: 1 }}
                    >
                        Pedidos
                    </Button>
                </Toolbar>
            </Container>
        </AppBar>
    );
}