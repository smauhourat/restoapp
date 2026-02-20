import { useEffect, useState } from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TablePagination, CircularProgress, Box, Chip,
} from '@mui/material';
import apiClient from '../api/client';

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function EmpresaList() {
  const [empresas, setEmpresas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpresas();
  }, [page, rowsPerPage]);

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/empresas', {
        params: { page: page + 1, perPage: rowsPerPage },
      });
      setEmpresas(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Empresas
      </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No hay empresas registradas
                  </TableCell>
                </TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id} hover>
                    <TableCell>{empresa.nombre}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20]}
          labelRowsPerPage="Filas:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>
    </Container>
  );
}
