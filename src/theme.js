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
                size: 'small', // Tamaño por defecto
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                borderRadius: '16px',
            },
        },
        // Sobrescribir estilos para OutlinedInput (la variante 'outlined' del input real)
        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ ownerState, theme }) => ({
                    // Aplicar estilos solo si el tamaño es 'small'
                    // o forzar un tamaño si no se especifica 'size'
                    ...(ownerState.size === 'small' && {
                        // Este es el InputBase-root para 'outlined'
                        // Reduce la altura total ajustando el padding vertical
                        '& .MuiOutlinedInput-input': {
                            paddingTop: '8.5px', // Ajusta este valor
                            paddingBottom: '8.5px', // Ajusta este valor
                            // Puedes ajustar el font-size si es necesario
                            // fontSize: '0.875rem', // o 14px
                        },
                        // Ajustar la posición del label para que se vea bien centrado en el input reducido
                        '& .MuiInputLabel-root': {
                            transform: 'translate(14px, 7px) scale(1)', // Ajuste para el estado inicial
                            '&.MuiInputLabel-shrink': {
                                transform: 'translate(14px, -9px) scale(0.75)', // Ajuste cuando está enfocado/lleno
                            },
                        },
                    }),
                    // Si quieres que todos los outlined inputs sean pequeños por defecto (sin especificar size="small")
                    // Puedes descomentar y ajustar esto:
                    // '& .MuiOutlinedInput-input': {
                    //   paddingTop: '8.5px',
                    //   paddingBottom: '8.5px',
                    // },
                    // '& .MuiInputLabel-root': {
                    //   transform: 'translate(14px, 7px) scale(1)',
                    //   '&.MuiInputLabel-shrink': {
                    //     transform: 'translate(14px, -9px) scale(0.75)',
                    //   },
                    // },
                }),
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
  