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
        body1: {
            fontSize: '0.85rem', // Default is 1rem (16px)
            // You can also use px:
            // fontSize: '18px',
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
                    height: '50px'
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    //fontFamily: "'Open Sans', sans-serif",
                    fontSize: '1rem',
                },
                head: {
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    letterSpacing: '0.5px',
                },
                body: {
                    fontWeight: 400,
                    fontSize: '0.9rem',
                },
            },
        },
    },
});

export default theme;
  