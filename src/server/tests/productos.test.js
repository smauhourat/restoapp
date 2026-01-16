import request from 'supertest';
import express from 'express';
import productosRoutes from '../routes/productos.js';
import db from '../db.js';

const app = express();
app.use(express.json());
app.use('/api/productos', productosRoutes);

// Mock de la base de datos para tests
beforeAll(() => {
  // Crear tabla de prueba o usar una base de datos en memoria si es posible
  // Para better-sqlite3, puedes usar :memory:
});

afterAll(() => {
  // Limpiar
});

describe('GET /api/productos', () => {
  it('should return a list of products', async () => {
    const response = await request(app).get('/api/productos');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    console.log(response.body);
  });
});

describe('POST /api/productos', () => {
  it('should create a new product', async () => {
    const newProduct = {
      nombre: 'Producto de Prueba2',
      descripcion: 'Descripción de prueba',
      unidad_medida: 'kg'
    };
    const response = await request(app).post('/api/productos').send(newProduct);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });
});