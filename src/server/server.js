import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { initDatabase } from './models.js';
import db from './db.js';
import productosRoutes from './routes/productos.js'
import proveedoresRoutes from './routes/proveedores.js'
import pedidosRoutes from './routes/pedidos.js'
import statsRoutes from './routes/stats.js'

// Middleware para limpiar strings en el body
const cleanBodyMiddleware = (req, res, next) => {
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = value.trim();
      }
    }
  }
  next();
};

const app = express();
//const PORT = process.env.PORT || 3001;
const PORT = 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cleanBodyMiddleware);
//app.use('/api', router);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/stats', statsRoutes);

initDatabase(db); // Crear tablas si no existen

app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});