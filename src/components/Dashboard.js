import { Grid, Box, Card, CardHeader, CardContent, IconButton, Typography, Container } from '@mui/material';
import { LineChart, PieChart } from '@mui/x-charts';
import { MoreVert } from '@mui/icons-material';

export default function Dashboard() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>


        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Proveedores"
            />
            <CardContent>
              <Typography variant="h4">1,254</Typography>
              <Typography color="text.secondary">+12% this month</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Productos"
            />
            <CardContent>
              <Typography variant="h4">1,254</Typography>
              <Typography color="text.secondary">+12% this month</Typography>
            </CardContent>
          </Card>
        </Grid>        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardHeader
              action={
                <IconButton aria-label="settings">
                  <MoreVert />
                </IconButton>
              }
              title="Total Pedidos"
            />
            <CardContent>
              <Typography variant="h4">1,254</Typography>
              <Typography color="text.secondary">+12% this month</Typography>
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
