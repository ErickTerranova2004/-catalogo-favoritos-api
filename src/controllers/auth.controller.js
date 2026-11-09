// Controlador de autenticación: registro e inicio de sesión.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/env');
const usuariosRepo = require('../repositories/usuarios.repository');
const { validarRegistro, validarLogin } = require('../validators/auth.validator');
const ApiError = require('../utils/ApiError');
const { enviar } = require('../utils/respuesta');

// Hash ficticio para comparar cuando el correo no existe: así el login tarda lo mismo
// exista o no el usuario, y no se puede adivinar qué correos están registrados.
const HASH_FICTICIO = bcrypt.hashSync('contraseña-que-no-existe', 10);

// POST /api/auth/registro  (público)
async function registro(req, res) {
  const { nombre, correo, password } = validarRegistro(req.body);

  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  try {
    // El repositorio siempre crea el usuario con rol 'usuario'.
    const usuario = await usuariosRepo.crear({ nombre, correo, passwordHash });
    enviar(res, 201, { usuario });
  } catch (err) {
    if (err.code === '23505') throw ApiError.conflicto('El correo ya está registrado');
    throw err;
  }
}

// POST /api/auth/login  (público)
async function login(req, res) {
  const { correo, password } = validarLogin(req.body);

  const usuario = await usuariosRepo.buscarPorCorreoConHash(correo);
  const coincide = await bcrypt.compare(password, usuario ? usuario.password_hash : HASH_FICTICIO);

  // Mismo mensaje si el correo no existe o si la contraseña es incorrecta.
  if (!usuario || !coincide) {
    throw ApiError.noAutenticado('Correo o contraseña incorrectos', 'CREDENCIALES_INVALIDAS');
  }

  // Se firma el JWT con vencimiento. "sub" = id del usuario (estándar JWT).
  const token = jwt.sign(
    { sub: String(usuario.id), rol: usuario.rol, nombre: usuario.nombre },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: jwtExpiresIn }
  );
  const { exp } = jwt.decode(token);

  // Se arma la respuesta sin el hash de la contraseña.
  const { password_hash, ...usuarioPublico } = usuario; // eslint-disable-line no-unused-vars
  enviar(res, 200, {
    token,
    tipo: 'Bearer',
    expiraEn: new Date(exp * 1000).toISOString(),
    usuario: usuarioPublico,
  });
}

module.exports = { registro, login };
