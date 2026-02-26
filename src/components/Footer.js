import { Box, Typography, Link } from '@mui/material';
import pkg from '../../package.json';
const { version } = pkg;

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                py: 1.5,
                textAlign: 'center',
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
        >
            <Typography variant="caption" color="text.secondary">
                RestoApp v{version} - Copyright © 2026 <a href="https://adhentux.com" target="_blank" rel="noreferrer">Adhentux.</a> Todos los derechos reservados.
            </Typography>
        </Box>
    );
}
