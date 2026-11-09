// Middlewares de seguridad:
//  - verificarToken: exige un JWT válido (firma + expiración) -> si falla, 401.
//  - requiereRol:    exige un rol concreto (ej. 'admin')        -> si falla, 403.
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const usuariosRepo = require('../repositories/usuarios.repository');
const ApiError = require('../utils/ApiError');

async function verificarToken(req, res, next) {
  // 1. Leer el encabezado "Authorization: Bearer <token>"
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw ApiError.noAutenticado('Falta el token. Usa el encabezado Authorization: Bearer <token>', 'TOKEN_AUSENTE');
  }

  // 2. Verificar firma y expiración. Se fija el algoritmo para evitar ataques
  //    de cambio de algoritmo (por ejemplo, tokens con "alg": "none").
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.noAutenticado('El token ha expirado. Inicia sesión nuevamente', 'TOKEN_EXPIRADO');
    }
    throw ApiError.noAutenticado('Token inválido', 'TOKEN_INVALIDO');
  }

  // 3. Confirmar que el usuario sigue existiendo y leer su rol ACTUAL desde la BD
  //    (si se le quitó el rol admin, el token viejo ya no sirve para administrar).
  const usuario = await usuariosRepo.buscarPorId(Number(payload.sub));
  if (!usuario) {
    throw ApiError.noAutenticado('El usuario del token ya no existe', 'TOKEN_INVALIDO');
  }

  // 4. Guardar la identidad verificada. Los controladores usan req.usuario.id,
  //    NUNCA un id enviado por el cliente.
  req.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
  next();
}

// Fábrica de middleware: requiereRol('admin') devuelve un middleware que solo deja pasar admins.
function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      throw ApiError.prohibido('Solo un administrador puede realizar esta acción');
    }
    next();
  };
}

module.exports = { verificarToken, requiereRol };
