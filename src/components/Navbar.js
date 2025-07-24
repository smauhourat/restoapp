import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import logo from './../logo.png'; 

export default function Navbar() {
    return (
        <AppBar position="static">
            <Container maxWidth="xl">
                <Toolbar disableGutters>
                    {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Gestión de Proveedores
                    </Typography> */}
                    <Box
                        component="img"
                        src={logo}
                        alt="Logo de la empresa"
                        sx={{
                            height: 40, // Ajusta según necesites
                            mr: 2 // Margen a la derecha
                        }}
                    />                  
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