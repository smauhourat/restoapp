import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, Box, Chip, IconButton,
  Button, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, Stack, Pagination, Switch,
  Snackbar, Alert,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PeopleIcon from '@mui/icons-material/People';
import apiClient from '../api/client';

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  return new Date(isoStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

const INITIAL_FORM = { nombre: '', admin_nombre: '', admin_email: '', admin_password: '' };

export default function EmpresaList() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' });

  // Dialog nueva empresa
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmpresas();
  }, [page]);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/empresas', { params: { page, perPage } });
      setEmpresas(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActivo = async (empresa) => {
    const nuevoActivo = !empresa.activo;
    try {
      await apiClient.patch(`/auth/empresas/${empresa.id}/activo`, { activo: nuevoActivo });
      setEmpresas((prev) =>
        prev.map((e) => e.id === empresa.id ? { ...e, activo: nuevoActivo } : e)
      );
    } catch {
      showSnackbar('Error al cambiar el estado de la empresa', 'error');
    }
  };

  const handleCrearEmpresa = async () => {
    if (!form.nombre || !form.admin_nombre || !form.admin_email || !form.admin_password) {
      showSnackbar('Todos los campos son obligatorios', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/auth/empresas', {
        nombre: form.nombre,
        admin_nombre: form.admin_nombre,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
      });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      setPage(1);
      fetchEmpresas();
      showSnackbar('Empresa creada correctamente', 'success');
    } catch (err) {
      showSnackbar(err?.response?.data?.error || 'Error al crear la empresa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const showSnackbar = (msg, severity = 'success') =>
    setSnackbar({ open: true, msg, severity });

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Empresas
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddCircleIcon />}
        sx={{ mb: 3 }}
        onClick={() => setDialogOpen(true)}
      >
        Nueva Empresa
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
                <TableCell><strong>Slug</strong></TableCell>
                <TableCell><strong>Activo</strong></TableCell>
                <TableCell><strong>Creado el</strong></TableCell>
                <TableCell align="right" sx={{ pr: '1.5rem' }}><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay empresas registradas
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id} hover>
                    <TableCell>{empresa.nombre}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {empresa.slug}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={empresa.activo ? 'Activo' : 'Inactivo'}
                        color={empresa.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(empresa.creado_en)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={empresa.activo ? 'Desactivar empresa' : 'Activar empresa'}>
                        <Switch
                          size="small"
                          checked={!!empresa.activo}
                          onChange={() => handleToggleActivo(empresa)}
                          color="success"
                        />
                      </Tooltip>
                      <Tooltip title="Ver usuarios">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(
                            `/empresas/${empresa.id}/usuarios`,
                            { state: { empresaNombre: empresa.nombre } }
                          )}
                        >
                          <PeopleIcon />
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">Total: {total}</Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Stack>
        </Box>
      )}

      {/* Dialog nueva empresa */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Empresa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre de la empresa"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            fullWidth
            autoFocus
          />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
            Administrador inicial
          </Typography>
          <TextField
            label="Nombre del admin"
            value={form.admin_nombre}
            onChange={(e) => setForm((f) => ({ ...f, admin_nombre: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Email del admin"
            type="email"
            value={form.admin_email}
            onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Contraseña del admin"
            type="password"
            value={form.admin_password}
            onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setForm(INITIAL_FORM); }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleCrearEmpresa} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
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
