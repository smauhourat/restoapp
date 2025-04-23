import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { initDatabase } from './models.js';
import router from './routes.js';
import productosRoutes from './routes/productos.js'
import proveedoresRoutes from './routes/proveedores.js'
import pedidosRoutes from './routes/pedidos.js'

const app = express();
//const PORT = process.env.PORT || 3001;
const PORT = 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', router);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);

initDatabase(); // Crear tablas si no existen

app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});