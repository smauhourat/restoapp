import { z } from 'zod';
import {
  positiveIntegerField,
  stringField,
  optionalStringField,
} from './common.js';

export const productoSortFields = ['nombre', 'descripcion'];
const orderValues = ['asc', 'desc'];

const sortBySchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(productoSortFields).default('nombre'),
);

const orderSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
  z.enum(orderValues).default('asc'),
);

const listQuerySchema = z.object({
  page: positiveIntegerField('page').default(1),
  perPage: positiveIntegerField('perPage').default(99999),
  sortBy: sortBySchema,
  order: orderSchema,
  search: z
    .string({ invalid_type_error: 'search es inválido' })
    .transform((val) => val.trim())
    .optional()
    .default(''),
});

const productoBodySchema = z.object({
  nombre: stringField('Nombre', { min: 3 }),
  descripcion: optionalStringField('Descripción', { max: 255 }).default(''),
  unidad_medida: stringField('unidad_medida'),
});

export const listProductosSchema = { query: listQuerySchema };

export const productoIdSchema = {
  params: z.object({
    id: positiveIntegerField('id'),
  }),
};

export const createProductoSchema = {
  body: productoBodySchema,
};

export const updateProductoSchema = {
  ...productoIdSchema,
  body: productoBodySchema,
};

export const deleteProductoSchema = productoIdSchema;

export const confirmarImportacionSchema = {
  body: z.object({
    productos: z
      .array(
        z.object({
          nombre: stringField('productos[].nombre', { min: 1 }),
          descripcion: optionalStringField('productos[].descripcion').default(''),
          unidad: stringField('productos[].unidad'),
        }),
        {
          required_error: 'Debe incluir al menos un producto',
        },
      )
      .nonempty({ message: 'Debe incluir al menos un producto' }),
  }),
};
