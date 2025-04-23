import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { initDatabase } from './models.js';
import router from './routes.js';

const app = express();
//const PORT = process.env.PORT || 3001;
const PORT = 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', router);

initDatabase(); // Crear tablas si no existen

app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});