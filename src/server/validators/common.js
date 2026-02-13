import { z } from 'zod';

const coerceNumericInput = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return Number.isFinite(value) ? value : NaN;
};

const baseNumberField = (fieldName) =>
  z.number({
    required_error: `${fieldName} es obligatorio`,
    invalid_type_error: `${fieldName} debe ser un número válido`,
  });

export const positiveIntegerField = (fieldName) =>
  z
    .preprocess(coerceNumericInput, baseNumberField(fieldName))
    .refine((value) => Number.isInteger(value) && value > 0, {
      message: `${fieldName} debe ser un entero positivo`,
    });

export const positiveNumberField = (fieldName) =>
  z
    .preprocess(coerceNumericInput, baseNumberField(fieldName))
    .refine((value) => Number.isFinite(value) && value > 0, {
      message: `${fieldName} debe ser un número positivo`,
    });

export const stringField = (fieldName, { min = 1, max } = {}) => {
  let schema = z
    .string({
      required_error: `${fieldName} es obligatorio`,
      invalid_type_error: `${fieldName} es obligatorio`,
    })
    .trim();

  if (min > 0) {
    schema = schema.min(min, `${fieldName} debe tener al menos ${min} caracteres`);
  }

  if (max) {
    schema = schema.max(max, `${fieldName} no puede tener más de ${max} caracteres`);
  }

  return schema;
};

export const optionalStringField = (fieldName, { max } = {}) => {
  let schema = z
    .string({ invalid_type_error: `${fieldName} es inválido` })
    .trim()
    .optional();

  if (max) {
    schema = schema.refine((val) => !val || val.length <= max, {
      message: `${fieldName} no puede tener más de ${max} caracteres`,
    });
  }

  return schema;
};

export const emailField = () =>
  stringField('Email').min(1, 'Email es obligatorio').email('Email inválido');

export const telefonoField = () =>
  stringField('Teléfono').regex(/^[0-9]+$/, 'Teléfono es obligatorio y solo acepta números');

export const dateField = (fieldName) =>
  z
    .string({
      required_error: `${fieldName} es obligatorio`,
      invalid_type_error: `${fieldName} debe ser una fecha válida`,
    })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: `${fieldName} debe ser una fecha válida`,
    });

export const searchField = (fieldName = 'search') =>
  z
    .string({ invalid_type_error: `${fieldName} es inválido` })
    .transform((val) => val.trim())
    .optional()
    .default('');

export const orderField = (fieldName = 'order', values = ['asc', 'desc']) =>
  z
    .string({ invalid_type_error: `${fieldName} es inválido` })
    .transform((val) => val.toLowerCase())
    .refine((val) => values.includes(val), {
      message: `${fieldName} debe ser uno de: ${values.join(', ')}`,
    });

export const enumField = (fieldName, values) =>
  z
    .string({ invalid_type_error: `${fieldName} es inválido` })
    .transform((val) => val.trim())
    .refine((val) => values.includes(val), {
      message: `${fieldName} debe ser uno de: ${values.join(', ')}`,
    });
