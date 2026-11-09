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

  // En Express 5, si el puerto no está disponible el error llega a este callback.
  const servidor = app.listen(port, (err) => {
    if (err) {
      const motivo = err.code === 'EADDRINUSE'
        ? `el puerto ${port} ya está en uso (¿hay otra terminal con el servidor encendido?)`
        : err.message;
      console.error(`No se pudo iniciar el servidor: ${motivo}`);
      process.exit(1);
    }
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