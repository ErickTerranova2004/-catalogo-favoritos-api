const ApiError = require('../utils/ApiError');
const { esTextoNoVacio, exigirCuerpo } = require('./comunes');

// Valida el cuerpo para crear (POST) o reemplazar (PUT) un producto.
// PUT es un reemplazo completo, así que exige los mismos campos que POST.
// Solo se devuelven los campos permitidos: cualquier otro (ej. "id") se descarta.
function validarProducto(body) {
  exigirCuerpo(body);
  const { nombre, descripcion, categoria, precio } = body;
  const errores = [];

  if (!esTextoNoVacio(nombre)) errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio' });
  else if (nombre.trim().length > 120) errores.push({ campo: 'nombre', mensaje: 'Máximo 120 caracteres' });

  if (!esTextoNoVacio(descripcion)) errores.push({ campo: 'descripcion', mensaje: 'La descripción es obligatoria' });

  if (!esTextoNoVacio(categoria)) errores.push({ campo: 'categoria', mensaje: 'La categoría es obligatoria' });
  else if (categoria.trim().length > 60) errores.push({ campo: 'categoria', mensaje: 'Máximo 60 caracteres' });

  // El precio debe ser un número (no un texto como "10"), finito, > 0 y con máximo 2 decimales.
  if (typeof precio !== 'number' || !Number.isFinite(precio)) {
    errores.push({ campo: 'precio', mensaje: 'El precio es obligatorio y debe ser numérico' });
  } else if (precio <= 0) {
    errores.push({ campo: 'precio', mensaje: 'El precio debe ser mayor que cero' });
  } else if (precio >= 100000000) {
    errores.push({ campo: 'precio', mensaje: 'El precio es demasiado alto' });
  } else if (Math.round(precio * 100) / 100 !== precio) {
    errores.push({ campo: 'precio', mensaje: 'El precio admite máximo 2 decimales' });
  }

  if (errores.length) throw ApiError.validacion(errores);

  return {
    nombre: nombre.trim(),
    descripcion: descripcion.trim(),
    categoria: categoria.trim().toLowerCase(),
    precio,
  };
}

module.exports = { validarProducto };
