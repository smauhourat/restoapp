import { useEffect, useState } from 'react';
import { Grid, Card, Box, CardHeader, CardContent, IconButton, Typography, Container } from '@mui/material';
import { PieChart } from '@mui/x-charts';
import { MoreVert } from '@mui/icons-material';

import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext.js';


export default function Dashboard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol === 'superadmin';
  const [estadisticas, setEstadisticas] = useState([]);

  useEffect(() => {
    fetchEstadisticas();
  }, []);


  const fetchEstadisticas = async () => {
    console.log('Fetching statistics...');
    const data = await apiClient.get('/stats/dashboard');
    setEstadisticas(data)
    console.log(data);
  };

  if (isSuperAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
              <CardHeader
                action={<IconButton aria-label="settings"><MoreVert /></IconButton>}
                title="Total Empresas"
              />
              <CardContent>
                <Typography variant="h4">{estadisticas.total_empresas}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>


        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Proveedores"
            />
            <CardContent>
              <Typography variant="h4">{estadisticas.total_proveedores}</Typography>
              <Typography color="text.secondary"></Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Productos"
            />
            <CardContent>
              <Typography variant="h4">{estadisticas.total_productos}</Typography>
              <Typography color="text.secondary"></Typography>
            </CardContent>
          </Card>
        </Grid>        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Pedidos"
            />
            <CardContent>
              <Typography variant="h4">{estadisticas.total_pedidos}</Typography>
              <Typography color="text.secondary"></Typography>
            </CardContent>
          </Card>
        </Grid> 
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ boxShadow: '5px 5px 5px rgba(83, 82, 82, 0.2)' }}>
            <CardHeader title="Pedidos x Estado" />
            <CardContent>
              {/* <Box sx={{ height: 300 }}> */}
              <Box>
                <PieChart
                  series={[
                    {
                      data: [
                        { id: 0, value: estadisticas.pedidos_pendientes_porc, label: 'Pendientes' },
                        { id: 1, value: estadisticas.pedidos_enviados_porc, label: 'Enviados' },
                        { id: 2, value: estadisticas.pedidos_recibidos_porc, label: 'Recibidos' },
                        { id: 3, value: estadisticas.pedidos_cancelados_porc, label: 'Cancelados' },
                      ],
                    },
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>        

        {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardHeader title="Revenue" />
            <CardContent sx={{ height: 200 }}>

              <Typography variant="h4">$24,300</Typography>
            </CardContent>
          </Card>
        </Grid> */}
{/* 
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardHeader title="Ventas x Proveedor" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <PieChart
                  series={[
                    {
                      data: [
                        { id: 0, value: 35, label: 'Product A' },
                        { id: 1, value: 25, label: 'Product B' },
                        { id: 2, value: 20, label: 'Product C' },
                        { id: 3, value: 20, label: 'Product D' },
                      ],
                    },
                  ]}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid> */}


      </Grid>
    </Container>
  );
}
