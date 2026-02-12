// __tests__/proveedores.test.js
import request from 'supertest';
import express from 'express';
import proveedoresRouter from '../routes/proveedores.js';
import db from '../db.js';

// Mock completo del módulo de base de datos
//Reemplaza todo el módulo db.js por un objeto falso que solo tiene una función prepare simulada (jest.fn()). Esto evita que los tests intenten conectar a una base de datos real. Todos los 
//métodos de consulta (get, all, run) serán simulados en cada test.
jest.mock('../db.js', () => ({
  prepare: jest.fn(),
}));

// Configuración de la app de Express para las pruebas
const app = express();
app.use(express.json());
app.use('/api/proveedores', proveedoresRouter);

describe('Proveedores API', () => {
  // Limpiar todos los mocks antes de cada test
  beforeEach(() => {
    jest.clearAllMocks();
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

      db.prepare
        .mockReturnValueOnce(mockStmt)        // SELECT ... LIMIT ? OFFSET ?
        .mockReturnValueOnce(mockStmtCount); // SELECT COUNT(*)

      const response = await request(app)
        .get('/api/proveedores?page=2&perPage=5')
        .expect(200);
      
      console.log('Response:', response.body);

      expect(db.prepare).toHaveBeenCalledTimes(2);
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

    // it('debería usar valores por defecto page=1 y perPage=10 si no se proveen', async () => {
    //   const mockProveedores = [{ id: 1, nombre: 'Proveedor A', productos: 2 }];
    //   const mockTotal = { total: 1 };

    //   const mockStmt = { all: jest.fn().mockReturnValue(mockProveedores) };
    //   const mockStmtCount = { get: jest.fn().mockReturnValue(mockTotal) };

    //   db.prepare
    //     .mockReturnValueOnce(mockStmt)
    //     .mockReturnValueOnce(mockStmtCount);

    //   const response = await request(app)
    //     .get('/api/proveedores')
    //     .expect(200);

    //   expect(mockStmt.all).toHaveBeenCalledWith(10, 0);
    //   expect(response.body.page).toBe(1);
    //   expect(response.body.perPage).toBe(10);
    // });
  });

  // describe('GET /api/proveedores/:id', () => {
  //   it('debería devolver un proveedor por su ID', async () => {
  //     const mockProveedor = { id: 5, nombre: 'Proveedor Test' };
  //     const mockStmt = { get: jest.fn().mockReturnValue(mockProveedor) };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .get('/api/proveedores/5')
  //       .expect(200);

  //     expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('WHERE p.id = ?'));
  //     expect(mockStmt.get).toHaveBeenCalledWith('5');
  //     expect(response.body).toEqual(mockProveedor);
  //   });

  //   it('debería devolver undefined si el proveedor no existe', async () => {
  //     const mockStmt = { get: jest.fn().mockReturnValue(undefined) };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .get('/api/proveedores/999')
  //       .expect(200);

  //     expect(response.body).toBeUndefined();
  //   });
  // });

  // describe('POST /api/proveedores', () => {
  //   const validProveedor = {
  //     nombre: 'Nuevo Proveedor',
  //     direccion: 'Calle Falsa 123',
  //     telefono: '123456789',
  //     email: 'contacto@proveedor.com',
  //   };

  //   it('debería crear un proveedor con datos válidos', async () => {
  //     // Mock: verificar que no exista proveedor con ese nombre
  //     const mockStmtExist = { get: jest.fn().mockReturnValue(undefined) };
  //     // Mock: insert
  //     const mockStmtInsert = { run: jest.fn().mockReturnValue({ lastInsertRowid: 100 }) };

  //     db.prepare
  //       .mockReturnValueOnce(mockStmtExist)   // SELECT por nombre duplicado
  //       .mockReturnValueOnce(mockStmtInsert); // INSERT

  //     const response = await request(app)
  //       .post('/api/proveedores')
  //       .send(validProveedor)
  //       .expect(200);

  //     expect(mockStmtExist.get).toHaveBeenCalledWith(validProveedor.nombre.toLowerCase());
  //     expect(mockStmtInsert.run).toHaveBeenCalledWith(
  //       validProveedor.nombre,
  //       validProveedor.direccion,
  //       validProveedor.telefono,
  //       validProveedor.email
  //     );
  //     expect(response.body).toEqual({ id: 100 });
  //   });

  //   it('debería rechazar si el nombre tiene menos de 3 caracteres', async () => {
  //     const response = await request(app)
  //       .post('/api/proveedores')
  //       .send({ ...validProveedor, nombre: 'ab' })
  //       .expect(400);

  //     expect(response.body.error).toMatch(/al menos 3 caracteres/);
  //     expect(db.prepare).not.toHaveBeenCalled(); // No debe llegar a la BD
  //   });

  //   it('debería rechazar si el nombre tiene más de 50 caracteres', async () => {
  //     const response = await request(app)
  //       .post('/api/proveedores')
  //       .send({ ...validProveedor, nombre: 'a'.repeat(51) })
  //       .expect(400);

  //     expect(response.body.error).toMatch(/no puede tener más de 50/);
  //   });

  //   it('debería rechazar si ya existe un proveedor con ese nombre', async () => {
  //     const mockStmtExist = { get: jest.fn().mockReturnValue({ id: 1 }) };
  //     db.prepare.mockReturnValueOnce(mockStmtExist);

  //     const response = await request(app)
  //       .post('/api/proveedores')
  //       .send(validProveedor)
  //       .expect(400);

  //     expect(response.body.error).toBe('Ya existe un proveedor con ese nombre');
  //   });

  //   it('debería rechazar si el teléfono no es solo números', async () => {
  //     const response = await request(app)
  //       .post('/api/proveedores')
  //       .send({ ...validProveedor, telefono: '123-456' })
  //       .expect(400);

  //     expect(response.body.error).toMatch(/solo acepta números/);
  //   });

  //   it('debería rechazar si el email está vacío o es inválido', async () => {
  //     // Email vacío
  //     let res = await request(app)
  //       .post('/api/proveedores')
  //       .send({ ...validProveedor, email: '' })
  //       .expect(400);
  //     expect(res.body.error).toMatch(/Email es obligatorio/);

  //     // Email sin formato correcto
  //     res = await request(app)
  //       .post('/api/proveedores')
  //       .send({ ...validProveedor, email: 'correo-invalido' })
  //       .expect(400);
  //     expect(res.body.error).toBe('Email inválido');
  //   });
  // });

  // describe('PUT /api/proveedores/:id', () => {
  //   const validUpdate = {
  //     nombre: 'Proveedor Actualizado',
  //     direccion: 'Nueva Dirección',
  //     telefono: '987654321',
  //     email: 'actualizado@proveedor.com',
  //   };

  //   it('debería actualizar un proveedor existente', async () => {
  //     // Mock: verificar que no exista otro proveedor con el mismo nombre (diferente ID)
  //     const mockStmtExist = { get: jest.fn().mockReturnValue(undefined) };
  //     const mockStmtUpdate = { run: jest.fn() };

  //     db.prepare
  //       .mockReturnValueOnce(mockStmtExist)
  //       .mockReturnValueOnce(mockStmtUpdate);

  //     const response = await request(app)
  //       .put('/api/proveedores/5')
  //       .send(validUpdate)
  //       .expect(200);

  //     expect(mockStmtExist.get).toHaveBeenCalledWith(validUpdate.nombre.toLowerCase(), '5');
  //     expect(mockStmtUpdate.run).toHaveBeenCalledWith(
  //       validUpdate.nombre,
  //       validUpdate.direccion,
  //       validUpdate.telefono,
  //       validUpdate.email,
  //       '5'
  //     );
  //     expect(response.body).toEqual({ success: true });
  //   });

  //   it('debería rechazar si el nombre ya pertenece a otro proveedor', async () => {
  //     const mockStmtExist = { get: jest.fn().mockReturnValue({ id: 10 }) };
  //     db.prepare.mockReturnValueOnce(mockStmtExist);

  //     const response = await request(app)
  //       .put('/api/proveedores/5')
  //       .send(validUpdate)
  //       .expect(400);

  //     expect(response.body.error).toBe('Ya existe un proveedor con ese nombre');
  //   });

  //   // Las validaciones de nombre, teléfono y email son las mismas que en POST
  //   it('debería rechazar con validaciones de campo', async () => {
  //     const res = await request(app)
  //       .put('/api/proveedores/5')
  //       .send({ ...validUpdate, nombre: 'ab' })
  //       .expect(400);
  //     expect(res.body.error).toMatch(/al menos 3 caracteres/);
  //   });
  // });

  // describe('GET /api/proveedores/:id/productos', () => {
  //   it('debería devolver los productos asociados a un proveedor', async () => {
  //     const mockProductos = [
  //       { id: 1, nombre: 'Producto X', precio_unitario: 100 },
  //     ];
  //     const mockStmt = { all: jest.fn().mockReturnValue(mockProductos) };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .get('/api/proveedores/5/productos')
  //       .expect(200);

  //     expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('JOIN Proveedor_Producto'));
  //     expect(mockStmt.all).toHaveBeenCalledWith('5');
  //     expect(response.body).toEqual(mockProductos);
  //   });
  // });

  // describe('POST /api/proveedores/:id/productos', () => {
  //   it('debería añadir un producto a un proveedor', async () => {
  //     const mockStmt = { run: jest.fn() };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const body = {
  //       producto_id: 10,
  //       precio_unitario: 250.5,
  //       tiempo_entrega: 5,
  //     };

  //     const response = await request(app)
  //       .post('/api/proveedores/5/productos')
  //       .send(body)
  //       .expect(200);

  //     expect(mockStmt.run).toHaveBeenCalledWith(
  //       '5',
  //       body.producto_id,
  //       body.precio_unitario,
  //       body.tiempo_entrega
  //     );
  //     expect(response.body).toEqual({ success: true });
  //   });
  // });

  // describe('GET /api/proveedores/:proveedorId/productos/:productoId', () => {
  //   it('debería devolver un producto específico del proveedor', async () => {
  //     const mockProducto = {
  //       id: 10,
  //       nombre: 'Producto Y',
  //       precio_unitario: 120.0,
  //     };
  //     const mockStmt = { get: jest.fn().mockReturnValue(mockProducto) };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .get('/api/proveedores/5/productos/10')
  //       .expect(200);

  //     expect(mockStmt.get).toHaveBeenCalledWith('5', '10');
  //     expect(response.body).toEqual(mockProducto);
  //   });
  // });

  // describe('PUT /api/proveedores/:proveedorId/productos/:productoId', () => {
  //   it('debería actualizar el precio_unitario del producto asociado', async () => {
  //     const mockStmt = { run: jest.fn() };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .put('/api/proveedores/5/productos/10')
  //       .send({ precio_unitario: 299.99 })
  //       .expect(200);

  //     expect(mockStmt.run).toHaveBeenCalledWith(299.99, '5', '10');
  //     expect(response.body).toEqual({ success: true });
  //   });

  //   it('debería rechazar si precio_unitario no es positivo', async () => {
  //     const response = await request(app)
  //       .put('/api/proveedores/5/productos/10')
  //       .send({ precio_unitario: -5 })
  //       .expect(400);

  //     expect(response.body.error).toMatch(/valor numerico positivo/);
  //   });

  //   it('debería rechazar si precio_unitario no se envía', async () => {
  //     const response = await request(app)
  //       .put('/api/proveedores/5/productos/10')
  //       .send({})
  //       .expect(400);

  //     expect(response.body.error).toMatch(/Debe ingresar un valor/);
  //   });
  // });

  // describe('DELETE /api/proveedores/:id', () => {
  //   it('debería eliminar un proveedor', async () => {
  //     const mockStmt = { run: jest.fn() };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .delete('/api/proveedores/5')
  //       .expect(200);

  //     expect(mockStmt.run).toHaveBeenCalledWith('5');
  //     expect(response.body).toEqual({ success: true });
  //   });
  // });

  // describe('DELETE /api/proveedores/:proveedorId/productos/:productoId', () => {
  //   it('debería eliminar la relación proveedor-producto', async () => {
  //     const mockStmt = { run: jest.fn() };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .delete('/api/proveedores/5/productos/10')
  //       .expect(200);

  //     expect(mockStmt.run).toHaveBeenCalledWith('5', '10');
  //     expect(response.body).toEqual({ success: true });
  //   });
  // });

  // describe('GET /api/proveedores/:id/productos-disponibles', () => {
  //   it('debería devolver productos no asignados al proveedor', async () => {
  //     const mockProductos = [
  //       { id: 2, nombre: 'Producto Libre' },
  //       { id: 3, nombre: 'Otro Producto' },
  //     ];
  //     const mockStmt = { all: jest.fn().mockReturnValue(mockProductos) };
  //     db.prepare.mockReturnValue(mockStmt);

  //     const response = await request(app)
  //       .get('/api/proveedores/5/productos-disponibles')
  //       .expect(200);

  //     expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('NOT IN'));
  //     expect(mockStmt.all).toHaveBeenCalledWith('5');
  //     expect(response.body).toEqual(mockProductos);
  //   });
  // });
});