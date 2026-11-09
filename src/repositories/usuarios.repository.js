// Acceso a datos de usuarios. Solo SQL parametrizado, sin lógica HTTP.
const db = require('../config/db');

// Columnas públicas: NUNCA incluyen password_hash.
const COLUMNAS_PUBLICAS = 'id, nombre, correo, rol, creado_en';

async function crear({ nombre, correo, passwordHash }) {
  // El rol se fija en 'usuario' aquí, no viene del cliente.
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'usuario')
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash]
  );
  return rows[0];
}

// Para el login sí se necesita el hash (para comparar), pero nunca se envía al cliente.
async function buscarPorCorreoConHash(correo) {
  const { rows } = await db.query(
    `SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM usuarios WHERE correo = $1`,
    [correo]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] || null;
}

module.exports = { crear, buscarPorCorreoConHash, buscarPorId };
