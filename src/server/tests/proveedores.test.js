// __tests__/proveedores.test.js
import request from 'supertest';
import express from 'express';
import proveedoresRouter from '../routes/proveedores.js';

// mockDb se recrea en cada beforeEach; authenticate lo inyecta como req.tenantDb
let mockDb;

jest.mock('../middleware/auth.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { tenant_id: 'test', rol: 'admin' };
    req.tenantDb = mockDb;
    next();
  },
}));

// Configuración de la app de Express para las pruebas
const app = express();
app.use(express.json());
app.use('/api/proveedores', proveedoresRouter);

describe('Proveedores API', () => {
  // Crear un mockDb fresco antes de cada test
  beforeEach(() => {
    mockDb = { prepare: jest.fn() };
  });

  describe('GET /api/proveedores', () => {
    it('debería devolver la lista paginada de proveedores con el conteo de productos', async () => {
      const mockProveedores = [
        { id: 1, nombre: 'Proveedor A', productos: 5 },
        { id: 2, nombre: 'Proveedor B', productos: 0 },
      ];
      const mockTotal = { total: 10 };

      // Mock de la consulta principal
      const mockStmt = {
        all: jest.fn().mockReturnValue(mockProveedores),
      };
      // Mock de la consulta de total
      const mockStmtCount = {
        get: jest.fn().mockReturnValue(mockTotal),
      };

      mockDb.prepare
        .mockReturnValueOnce(mockStmt)        // SELECT ... LIMIT ? OFFSET ?
        .mockReturnValueOnce(mockStmtCount); // SELECT COUNT(*)

      const response = await request(app)
        .get('/api/proveedores?page=2&perPage=5')
        .expect(200);

      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockStmt.all).toHaveBeenCalledWith(5, 5); // perPage, offset = (2-1)*5
      expect(mockStmtCount.get).toHaveBeenCalled();
      expect(response.body).toEqual({
        data: mockProveedores,
        total: 10,
        page: 2,
        perPage: 5,
        totalPages: 2,
      });
    });
  });
});
