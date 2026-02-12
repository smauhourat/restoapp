// import Database from 'better-sqlite3';
// import { initDatabase } from '../models.js';
import request from 'supertest';
import express from 'express';
import productosRoutes from '../routes/productos.js';

// Mock de db.js
jest.mock('../db.js', () => {
  const Database = require('better-sqlite3');
  const { initDatabase } = require('../models.js');
  const { seedDatabase } = require('./utils/seed_db.js');
  const testDb = new Database(':memory:');
  testDb.pragma('foreign_keys = ON');
  initDatabase(testDb);
  seedDatabase(testDb)
  return testDb;
});

const app = express();
app.use(express.json());
app.use('/api/productos', productosRoutes);

describe('GET /api/productos', () => {
  it('should return a list of products', async () => {
    const response = await request(app).get('/api/productos');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    //console.log(response.body);
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

// describe('POST /api/productos', () => {
//   it('should create a new product2', async () => {
//     const newProduct = {
//       nombre: 'Producto de Prueba2',
//       descripcion: 'Descripción de prueba',
//       unidad_medida: 'kg'
//     };
//     const response = await request(app).post('/api/productos').send(newProduct);
//     expect(response.status).toBe(200);
//     expect(response.body).toHaveProperty('id');
//   });
// });

//describe('