// Crea (o actualiza) el usuario administrador a partir de variables de entorno.
// Es la ÚNICA forma de obtener el rol admin: el registro público siempre crea 'usuario'.
// Uso: npm run admin:crear
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const { bcryptRounds } = require('../src/config/env');

async function main() {
  const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!correo || password.length < 8) {
    console.error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 8 caracteres) en tu archivo .env');
    process.exitCode = 1;
    return pool.end();
  }

  try {
    const hash = await bcrypt.hash(password, bcryptRounds);
    // Si el correo ya existe, se promueve a admin y se actualiza la contraseña.
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (correo)
       DO UPDATE SET rol = 'admin', password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre
       RETURNING id, nombre, correo, rol`,
      [nombre, correo, hash]
    );
    console.log('Administrador listo:', rows[0]);
  } catch (err) {
    console.error('No se pudo crear el administrador:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
