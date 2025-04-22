import { Typography, Container, Box } from '@mui/material';

export default function Home() {
    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="h3" gutterBottom>
                    Bienvenido al Sistema
                </Typography>
                <Typography variant="h5">
                    Selecciona una opción del menú superior.
                </Typography>
            </Box>
        </Container>
    );
}