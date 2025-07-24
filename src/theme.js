import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    // palette: {
    //     mode: 'dark',
    //     primary: {
    //         main: '#90caf9',
    //     },
    //     background: {
    //         default: '#121212',
    //         paper: '#1e1e1e',
    //     },
    //   },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
        },
        // button: {
        //     textTransform: 'none', // Para que los botones no estén en mayúsculas
        // },
      },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px', // Botones redondeados
                },
            },
            defaultProps: {
                size: 'medium', // Tamaño por defecto
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                borderRadius: '16px',
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: '6px',
                    height: '40px'
                },
            },
          },
    },
});

export default theme;
  