import { z } from 'zod';
import {
  positiveIntegerField,
  positiveNumberField,
  stringField,
  dateField,
} from './common.js';

const renglonSchema = z.object({
  producto_id: positiveIntegerField('renglones[].producto_id'),
  cantidad: positiveNumberField('renglones[].cantidad'),
  precio_unitario: positiveNumberField('renglones[].precio_unitario'),
});

export const listPedidosSchema = {
  query: z.object({
    page: positiveIntegerField('page').default(1),
    perPage: positiveIntegerField('perPage').default(10),
  }),
};

export const createPedidoSchema = {
  body: z.object({
    numero_pedido: stringField('numero_pedido'),
    fecha: dateField('fecha'),
    proveedor_id: positiveIntegerField('proveedor_id'),
    renglones: z
      .array(renglonSchema, {
        required_error: 'Debe incluir al menos un renglón',
        invalid_type_error: 'Debe incluir al menos un renglón',
      })
      .nonempty({ message: 'Debe incluir al menos un renglón' }),
  }),
};

export const pedidoIdParamSchema = {
  params: z.object({
    id: positiveIntegerField('id'),
  }),
};

export const updateEstadoSchema = {
  ...pedidoIdParamSchema,
  body: z.object({
    estado: stringField('estado'),
  }),
};

export const createEnvioSchema = {
  ...pedidoIdParamSchema,
  body: z.object({
    metodo_envio: stringField('metodo_envio'),
    destinatario: stringField('destinatario'),
  }),
};

export const historialEnviosSchema = pedidoIdParamSchema;
