import { Box, Typography } from '@mui/material';
import { version } from '../../package.json';

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
                RestoApp v{version}
            </Typography>
        </Box>
    );
}
