const ApiError = require('../utils/ApiError');
const { exigirCuerpo } = require('./comunes');

// Solo se acepta productoId. Si el cliente envía "usuarioId", se IGNORA:
// el usuario siempre se toma del token verificado.
function validarFavorito(body) {
  exigirCuerpo(body);
  const { productoId } = body;
  if (!Number.isInteger(productoId) || productoId < 1 || productoId > 2147483647) {
    throw ApiError.validacion([{ campo: 'productoId', mensaje: 'productoId es obligatorio y debe ser un entero positivo' }]);
  }
  return { productoId };
}

module.exports = { validarFavorito };
