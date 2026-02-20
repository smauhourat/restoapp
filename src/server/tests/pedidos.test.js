/** @jest-environment node */
import request from 'supertest';
import express from 'express';
import pedidosRoutes from '../routes/pedidos.js';
import { seedDatabase } from './utils/seed_db.js';

let mockTestDb; // prefijo "mock" requerido por Jest para variables en jest.mock()

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
app.use('/api/pedidos', pedidosRoutes);

const TABLES_TO_RESET = [
  'HistorialEnvios',
  'Pedido_Renglon',
  'Pedido',
  'Proveedor_Producto',
  'Producto',
  'Proveedor',
  'NrosPedidos',
];

const resetDatabase = () => {
  mockTestDb.exec('PRAGMA foreign_keys = OFF');
  TABLES_TO_RESET.forEach((table) => {
    mockTestDb.exec(`DELETE FROM ${table};`);
  });
  mockTestDb.exec('PRAGMA foreign_keys = ON');
  seedDatabase(mockTestDb);
};

let pedidoCounter = 0;
const buildPedidoPayload = (overrides = {}) => {
  pedidoCounter += 1;
  const basePayload = {
    numero_pedido: `TEST-PED-${pedidoCounter.toString().padStart(4, '0')}`,
    fecha: '2025-09-01',
    proveedor_id: 3,
    renglones: [
      { producto_id: 14, cantidad: 2, precio_unitario: 11.89 },
      { producto_id: 17, cantidad: 1, precio_unitario: 17.5 },
    ],
  };

  return {
    ...basePayload,
    ...overrides,
    renglones: overrides.renglones ?? basePayload.renglones,
  };
};

const createPedido = async (overrides = {}) => {
  const payload = buildPedidoPayload(overrides);
  const response = await request(app).post('/api/pedidos').send(payload).expect(200);
  return { id: response.body.id, payload };
};

beforeAll(() => {
  const Database = require('better-sqlite3');
  const { initDatabase } = require('../models.js');
  mockTestDb = new Database(':memory:');
  mockTestDb.pragma('foreign_keys = ON');
  initDatabase(mockTestDb);
  seedDatabase(mockTestDb);
});

beforeEach(() => {
  resetDatabase();
  pedidoCounter = 0;
});

describe('Pedidos API', () => {
  describe('GET /api/pedidos', () => {
    it('devuelve la lista paginada con metadatos y renglones calculados', async () => {
      const response = await request(app)
        .get('/api/pedidos?page=1&perPage=5')
        .expect(200);

      expect(response.body).toMatchObject({
        page: 1,
        perPage: 5,
        total: 2,
        totalPages: 1,
      });
      expect(response.body.data).toHaveLength(2);

      const pedido = response.body.data.find((item) => item.numero_pedido === 'PED-1000019');
      expect(pedido).toMatchObject({
        proveedor: 'ASG',
        cantidad_renglones: 2,
      });
    });

    it('rechaza parámetros de paginación inválidos', async () => {
      const response = await request(app)
        .get('/api/pedidos?page=0&perPage=-1')
        .expect(400);

      expect(response.body.error).toBe('page debe ser un entero positivo');
    });
  });

  describe('GET /api/pedidos/:id', () => {
    it('incluye los renglones y datos del proveedor', async () => {
      const response = await request(app).get('/api/pedidos/3').expect(200);

      expect(response.body).toMatchObject({
        id: 3,
        numero_pedido: 'PED-1000009',
        proveedor_nombre: 'ANDORCARN',
      });
      expect(response.body.renglones).toHaveLength(2);
      expect(response.body.renglones[0]).toHaveProperty('producto_nombre');
    });

    it('valida que el id del pedido sea numérico', async () => {
      const response = await request(app).get('/api/pedidos/abc').expect(400);

      expect(response.body.error).toBe('id debe ser un número válido');
    });

    it('responde 404 cuando el pedido no existe', async () => {
      const response = await request(app).get('/api/pedidos/9999').expect(404);

      expect(response.body.error).toBe('Pedido no encontrado');
    });
  });

  describe('POST /api/pedidos', () => {
    it('crea un pedido completo con sus renglones y total calculado', async () => {
      const { id, payload } = await createPedido();

      expect(id).toBeDefined();

      const detalle = await request(app).get(`/api/pedidos/${id}`).expect(200);
      expect(detalle.body.numero_pedido).toBe(payload.numero_pedido);
      expect(detalle.body.renglones).toHaveLength(payload.renglones.length);

      const totalEsperado = payload.renglones.reduce(
        (acc, renglon) => acc + renglon.cantidad * renglon.precio_unitario,
        0,
      );
      expect(detalle.body.total).toBeCloseTo(totalEsperado, 5);
    });

    it('rechaza crear un pedido cuando no se envían renglones', async () => {
      const payload = buildPedidoPayload();
      delete payload.renglones;

      const response = await request(app)
        .post('/api/pedidos')
        .send(payload)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Debe incluir al menos un renglón',
      });
    });

    it('valida cada campo de los renglones antes de guardar', async () => {
      const payload = buildPedidoPayload({
        renglones: [
          { producto_id: 0, cantidad: 0, precio_unitario: -5 },
        ],
      });

      const response = await request(app).post('/api/pedidos').send(payload).expect(400);

      expect(response.body.error).toBe('renglones[].producto_id debe ser un entero positivo');
      expect(response.body.detalles).toEqual(
        expect.arrayContaining([
          'renglones[].producto_id debe ser un entero positivo',
          'renglones[].cantidad debe ser un número positivo',
          'renglones[].precio_unitario debe ser un número positivo',
        ]),
      );
    });
  });

  describe('PATCH /api/pedidos/:id/estado', () => {
    it('actualiza el estado del pedido', async () => {
      const { id } = await createPedido();

      await request(app)
        .patch(`/api/pedidos/${id}/estado`)
        .send({ estado: 'enviado' })
        .expect(200);

      const updated = await request(app).get(`/api/pedidos/${id}`).expect(200);
      expect(updated.body.estado).toBe('enviado');
    });

    it('requiere el campo estado en el cuerpo', async () => {
      const { id } = await createPedido();

      const response = await request(app)
        .patch(`/api/pedidos/${id}/estado`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('estado es obligatorio');
    });
  });

  describe('Historial de envíos', () => {
    it('registra y recupera envíos asociados al pedido', async () => {
      const { id } = await createPedido();

      const envioPayload = { metodo_envio: 'wsp', destinatario: 'contacto@test.com' };

      await request(app)
        .post(`/api/pedidos/${id}/envios`)
        .send(envioPayload)
        .expect(200);

      const historial = await request(app).get(`/api/pedidos/${id}/envios`).expect(200);

      expect(historial.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            pedido_id: id,
            metodo_envio: envioPayload.metodo_envio,
            destinatario: envioPayload.destinatario,
          }),
        ]),
      );
    });

    it('valida datos obligatorios al registrar un envío', async () => {
      const { id } = await createPedido();

      const response = await request(app)
        .post(`/api/pedidos/${id}/envios`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('metodo_envio es obligatorio');
    });

    it('valida el id del pedido antes de registrar un envío', async () => {
      const response = await request(app)
        .post('/api/pedidos/abc/envios')
        .send({ metodo_envio: 'wsp', destinatario: 'contacto@test.com' })
        .expect(400);

      expect(response.body.error).toBe('id debe ser un número válido');
    });

    it('requiere un id válido para consultar el historial', async () => {
      const response = await request(app).get('/api/pedidos/abc/envios').expect(400);

      expect(response.body.error).toBe('id debe ser un número válido');
    });

    it('responde 404 si no existe el pedido al consultar historial', async () => {
      const response = await request(app).get('/api/pedidos/9999/envios').expect(404);

      expect(response.body.error).toBe('Pedido no encontrado');
    });
  });

  describe('POST /api/pedidos/nropedido', () => {
    it('genera un nuevo número de pedido incremental', async () => {
      const response = await request(app).post('/api/pedidos/nropedido').expect(200);

      expect(response.body).toHaveProperty('nro_pedido');
      expect(response.body.nro_pedido).toBeGreaterThan(1000000);
    });
  });
});
