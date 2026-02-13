export const sendError = (res, message, status = 400, details = []) => {
  const body = { error: message };
  if (details.length) {
    body.detalles = details;
  }
  return res.status(status).json(body);
};
