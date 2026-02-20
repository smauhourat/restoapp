import { z } from 'zod';
import {
  positiveIntegerField,
  positiveNumberField,
  stringField,
  optionalStringField,
  emailField,
  telefonoField,
} from './common.js';

const nombreField = () => stringField('Nombre', { min: 3, max: 50 });

const proveedorBodySchema = z.object({
  nombre: nombreField(),
  direccion: optionalStringField('Dirección', { max: 100 }).default(''),
  telefono: telefonoField(),
  email: emailField(),
});

export const listProveedoresSchema = {
  query: z.object({
    page: positiveIntegerField('page').default(1),
    perPage: positiveIntegerField('perPage').default(10),
    search: optionalStringField('search', { max: 100 }).default(''),
  }),
};

export const proveedorIdSchema = {
  params: z.object({
    id: positiveIntegerField('id'),
  }),
};

export const createProveedorSchema = {
  body: proveedorBodySchema,
};

export const updateProveedorSchema = {
  ...proveedorIdSchema,
  body: proveedorBodySchema,
};

export const proveedorProductosSchema = {
  params: z.object({
    id: positiveIntegerField('id'),
  }),
};

export const proveedorProductoDetailSchema = {
  params: z.object({
    proveedorId: positiveIntegerField('proveedorId'),
    productoId: positiveIntegerField('productoId'),
  }),
};

export const createProveedorProductoSchema = {
  ...proveedorProductosSchema,
  body: z.object({
    producto_id: positiveIntegerField('producto_id'),
    precio_unitario: positiveNumberField('precio_unitario'),
    tiempo_entrega: optionalStringField('tiempo_entrega', { max: 100 }).default(''),
  }),
};

export const updateProveedorProductoSchema = {
  ...proveedorProductoDetailSchema,
  body: z.object({
    precio_unitario: positiveNumberField('precio_unitario'),
  }),
};

export const deleteProveedorProductoSchema = proveedorProductoDetailSchema;

export const productosDisponiblesSchema = proveedorIdSchema;
