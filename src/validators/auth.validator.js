const ApiError = require('../utils/ApiError');
const { esTextoNoVacio, exigirCuerpo } = require('./comunes');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Devuelve SOLO los campos permitidos. Si el cliente envía "rol": "admin", se ignora.
function validarRegistro(body) {
  exigirCuerpo(body);
  const { nombre, correo, password } = body;
  const errores = [];

  if (!esTextoNoVacio(nombre)) errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
  else if (nombre.trim().length > 100) errores.push({ campo: 'nombre', mensaje: 'Máximo 100 caracteres' });

  if (!esTextoNoVacio(correo)) errores.push({ campo: 'correo', mensaje: 'El correo es obligatorio' });
  else if (!REGEX_CORREO.test(correo.trim()) || correo.length > 255) errores.push({ campo: 'correo', mensaje: 'El correo no tiene un formato válido' });

  if (typeof password !== 'string' || password.length < 8) errores.push({ campo: 'password', mensaje: 'La contraseña debe tener al menos 8 caracteres' });
  else if (password.length > 72) errores.push({ campo: 'password', mensaje: 'La contraseña no puede superar 72 caracteres' });

  if (errores.length) throw ApiError.validacion(errores);

  return { nombre: nombre.trim(), correo: correo.trim().toLowerCase(), password };
}

function validarLogin(body) {
  exigirCuerpo(body);
  const { correo, password } = body;
  const errores = [];
  if (!esTextoNoVacio(correo)) errores.push({ campo: 'correo', mensaje: 'El correo es obligatorio' });
  if (typeof password !== 'string' || password.length === 0) errores.push({ campo: 'password', mensaje: 'La contraseña es obligatoria' });
  if (errores.length) throw ApiError.validacion(errores);
  return { correo: correo.trim().toLowerCase(), password };
}

module.exports = { validarRegistro, validarLogin };
