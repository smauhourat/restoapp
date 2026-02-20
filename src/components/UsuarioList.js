import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Box, Chip, IconButton,
  Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, TextField, Select, MenuItem, FormControl, InputLabel,
  Switch, Snackbar, Alert, Stack,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api/client';

const ROLES = ['admin', 'operador', 'visor'];

const INITIAL_FORM = { nombre: '', email: '', password: '', rol: 'operador' };

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export default function UsuarioList() {
  const { empresaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const empresaNombre = location.state?.empresaNombre ?? 'Empresa';

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });

  // Dialog nuevo usuario
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Dialog eliminar
  const [deleteDialog, setDeleteDialog] = useState({ open: false, usuario: null });

  useEffect(() => {
    fetchUsuarios();
  }, [empresaId]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/auth/usuarios', { params: { empresa_id: empresaId } });
      setUsuarios(data);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (usuario) => {
    const nuevoActivo = !usuario.activo;
    try {
      await apiClient.patch(`/auth/usuarios/${usuario.id}/activo`, { activo: nuevoActivo });
      setUsuarios((prev) =>
        prev.map((u) => u.id === usuario.id ? { ...u, activo: nuevoActivo } : u)
      );
    } catch {
      showSnackbar('Error al cambiar el estado del usuario', 'error');
    }
  };

  const handleEliminar = async () => {
    const usuario = deleteDialog.usuario;
    try {
      await apiClient.delete(`/auth/usuarios/${usuario.id}`);
      setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
      setDeleteDialog({ open: false, usuario: null });
      showSnackbar('Usuario eliminado');
    } catch {
      showSnackbar('Error al eliminar el usuario', 'error');
    }
  };

  const handleCrearUsuario = async () => {
    if (!form.nombre || !form.email || !form.password || !form.rol) {
      showSnackbar('Todos los campos son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/auth/usuarios', {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
        empresa_id: empresaId,
      });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      fetchUsuarios();
      showSnackbar('Usuario creado correctamente');
    } catch (err) {
      showSnackbar(err?.response?.data?.error || 'Error al crear el usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (msg, severity = 'success') =>
    setSnackbar({ open: true, msg, severity });

  const ROL_COLOR = { admin: 'primary', operador: 'secondary', visor: 'default' };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <IconButton onClick={() => navigate('/empresas')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Empresas</Typography>
      </Stack>

      <Typography variant="h5" fontWeight={600} mb={2}>
        Usuarios — {empresaNombre}
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddCircleIcon />}
        sx={{ mb: 3 }}
        onClick={() => setDialogOpen(true)}
      >
        Nuevo Usuario
      </Button>

      <TableContainer component={Paper} sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Activo</strong></TableCell>
                <TableCell><strong>Creado el</strong></TableCell>
                <TableCell align="right" sx={{ pr: '1.5rem' }}><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay usuarios en esta empresa
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id} hover>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{usuario.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.rol}
                        color={ROL_COLOR[usuario.rol] ?? 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}>
                        <Switch
                          size="small"
                          checked={!!usuario.activo}
                          onChange={() => handleToggleActivo(usuario)}
                          color="success"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{formatDate(usuario.creado_en)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Eliminar usuario">
                        <IconButton
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, usuario })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Dialog nuevo usuario */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Usuario</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            fullWidth
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={form.rol}
              label="Rol"
              onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setForm(INITIAL_FORM); }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleCrearUsuario} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar eliminar */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, usuario: null })}>
        <DialogTitle>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se eliminará a <strong>{deleteDialog.usuario?.nombre}</strong> ({deleteDialog.usuario?.email}).
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, usuario: null })}>Cancelar</Button>
          <Button color="error" onClick={handleEliminar} autoFocus>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
