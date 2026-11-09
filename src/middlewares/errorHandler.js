// Manejo centralizado de errores: todas las respuestas de error tienen el mismo formato
// { ok: false, error: { codigo, mensaje, detalles? } } y nunca exponen detalles internos.
const ApiError = require('../utils/ApiError');

function rutaNoEncontrada(req, res, next) {
  next(ApiError.noEncontrado(`La ruta ${req.method} ${req.originalUrl} no existe`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  // JSON mal formado en el cuerpo (lo detecta express.json)
  if (err.type === 'entity.parse.failed') {
    error = ApiError.badRequest('El cuerpo de la petición no es un JSON válido');
  } else if (err.type === 'entity.too.large') {
    error = new ApiError(413, 'CUERPO_DEMASIADO_GRANDE', 'El cuerpo de la petición es demasiado grande');
  }
  // Respaldo: errores de restricciones de PostgreSQL no traducidos en el controlador
  else if (err.code === '23505') {
    error = ApiError.conflicto('El registro ya existe');
  } else if (err.code === '23503') {
    error = ApiError.noEncontrado('Se hace referencia a un registro que no existe');
  } else if (err.code === '23514' || err.code === '22001') {
    error = ApiError.validacion([{ mensaje: 'Un valor no cumple las restricciones de la base de datos' }]);
  }

  if (!(error instanceof ApiError)) {
    // Error inesperado: se registra en el servidor, pero al cliente solo se le da un mensaje genérico.
    console.error('[ERROR]', err);
    error = new ApiError(500, 'ERROR_INTERNO', 'Ocurrió un error interno. Intenta más tarde');
  }

  const cuerpo = { ok: false, error: { codigo: error.codigo, mensaje: error.message } };
  if (error.detalles) cuerpo.error.detalles = error.detalles;
  res.status(error.status).json(cuerpo);
}

module.exports = { rutaNoEncontrada, errorHandler };
