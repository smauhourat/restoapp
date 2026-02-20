import { ZodError } from 'zod';

const formatIssueMessage = (issue) => {
  const rawMessage = issue.message ?? '';
  if (!rawMessage.startsWith('Invalid input:')) {
    return rawMessage || 'Solicitud inválida';
  }

  const field = issue.path[issue.path.length - 1];

  if (rawMessage.includes('expected string')) {
    if (field === 'renglones') {
      return 'Debe incluir al menos un renglón';
    }
    return `${field} es obligatorio`;
  }

  if (rawMessage.includes('received NaN')) {
    return `${field} debe ser un número válido`;
  }

  if (rawMessage.includes('expected array')) {
    if (field === 'renglones') {
      return 'Debe incluir al menos un renglón';
    }
    return `${field} debe ser un arreglo válido`;
  }

  return 'Solicitud inválida';
};

const formatErrorResponse = (error) => {
  if (error instanceof ZodError) {
    const mensajes = error.issues.map(formatIssueMessage);
    return {
      status: 400,
      body: {
        error: mensajes[0] ?? 'Solicitud inválida',
        detalles: mensajes,
      },
    };
  }

  return {
    status: 400,
    body: { error: 'Solicitud inválida' },
  };
};

export const validateRequest = (schemas = {}) => (req, res, next) => {
  try {
    const validated = {};

    if (schemas.body) {
      validated.body = schemas.body.parse(req.body ?? {});
    }

    if (schemas.query) {
      validated.query = schemas.query.parse(req.query ?? {});
    }

    if (schemas.params) {
      validated.params = schemas.params.parse(req.params ?? {});
    }

    req.validated = validated;
    return next();
  } catch (err) {
    const { status, body } = formatErrorResponse(err);
    return res.status(status).json(body);
  }
};
