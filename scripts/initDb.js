// Ejecuta scripts/init.sql: crea las tablas y carga los productos de ejemplo.
// Uso: npm run db:init
// Con --reset borra las tablas antes (¡pierde todos los datos!): npm run db:reset
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function main() {
  const reset = process.argv.includes('--reset');
  try {
    if (reset) {
      await pool.query('DROP TABLE IF EXISTS favoritos, productos, usuarios CASCADE');
      console.log('Tablas eliminadas (reset).');
    }
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(sql);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM productos');
    console.log(`Base de datos lista. Productos en el catálogo: ${rows[0].total}`);
  } catch (err) {
    console.error('Error inicializando la base de datos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
