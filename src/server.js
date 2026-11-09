// Punto de entrada: comprueba la conexión a la BD y arranca el servidor HTTP.
const { port } = require('./config/env');
const { pool } = require('./config/db');
const app = require('./app');

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conectado a PostgreSQL');
  } catch (err) {
    console.error('No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }

  const servidor = app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}/api`);
  });

  // Cierre ordenado (Ctrl+C): se cierran conexiones antes de salir.
  const cerrar = () => {
    servidor.close(async () => {
      await pool.end();
      console.log('Servidor detenido');
      process.exit(0);
    });
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

iniciar();
