import request from 'supertest';
import express from 'express';
import productosRoutes from '../routes/productos.js';

let mockTestDb;

// Mock del middleware de auth: bypasea JWT e inyecta req.tenantDb con la DB de test
jest.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { tenant_id: 'test', rol: 'admin' };
    req.tenantDb = mockTestDb;
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/productos', productosRoutes);

beforeAll(() => {
  const Database = require('better-sqlite3');
  const { initDatabase } = require('../models.js');
  const { seedDatabase } = require('./utils/seed_db.js');
  mockTestDb = new Database(':memory:');
  mockTestDb.pragma('foreign_keys = ON');
  initDatabase(mockTestDb);
  seedDatabase(mockTestDb);
});

describe('GET /api/productos', () => {
  it('should return a list of products', async () => {
    const response = await request(app).get('/api/productos');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});

describe('POST /api/productos', () => {
  it('should create a new product', async () => {
    const newProduct = {
      nombre: 'Producto Automatizado',
      descripcion: 'Descripción de prueba',
      unidad_medida: 'kg'
    };
    const response = await request(app).post('/api/productos').send(newProduct);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });
});
