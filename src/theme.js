import { createTheme } from '@mui/material/styles';

const getPalette = (mode) =>
  mode === 'light'
    ? {
        mode,
        primary: { main: '#05636e' },
        secondary: { main: '#f97316' },
        background: {
          default: '#f5f7fb',
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
        },
      }
    : {
        mode,
        primary: { main: '#38bdf8' },
        secondary: { main: '#fb923c' },
        background: {
          default: '#020617',
          paper: '#0f172a',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#cbd5f5',
        },
      };

const componentsOverrides = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        textTransform: 'none',
      },
    },
    defaultProps: {
      size: 'small',
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      borderRadius: 16,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ ownerState }) => ({
        ...(ownerState.size === 'small' && {
          '& .MuiOutlinedInput-input': {
            paddingTop: 8.5,
            paddingBottom: 8.5,
          },
          '& .MuiInputLabel-root': {
            transform: 'translate(14px, 7px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
          },
        }),
      }),
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { fontSize: '1rem' },
      head: { fontWeight: 500, fontSize: '0.95rem', letterSpacing: '0.5px' },
      body: { fontWeight: 400, fontSize: '0.9rem' },
    },
  },
};

export const createAppTheme = (mode = 'light') => {
  const palette = getPalette(mode);
  return createTheme({
    palette,
    typography: {
      fontFamily: '"Manrope", "Inter", "Segoe UI", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 600 },
      body1: { fontSize: '0.95rem' },
    },
    components: {
      ...componentsOverrides,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
    },
  });
};
  
