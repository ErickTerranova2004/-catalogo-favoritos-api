const ApiError = require('../utils/ApiError');

const esTextoNoVacio = (v) => typeof v === 'string' && v.trim().length > 0;

// Valida un identificador que llega en la URL (/productos/:id).
// Un id mal formado ("abc", "-3", "1.5") es una petición mal construida -> 400.
function parsearId(valor, nombre = 'id') {
  if (!/^\d+$/.test(String(valor))) {
    throw ApiError.badRequest(`El parámetro '${nombre}' debe ser un entero positivo`);
  }
  const id = Number(valor);
  if (id < 1 || id > 2147483647) {
    throw ApiError.badRequest(`El parámetro '${nombre}' está fuera de rango`);
  }
  return id;
}

// Verifica que el cuerpo sea un objeto JSON (no un arreglo ni vacío).
function exigirCuerpo(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('El cuerpo de la petición debe ser un objeto JSON');
  }
}

module.exports = { esTextoNoVacio, parsearId, exigirCuerpo };
