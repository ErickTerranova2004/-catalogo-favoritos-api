// Pool de conexiones a PostgreSQL.
// Todas las consultas del proyecto pasan por aquí y usan parámetros ($1, $2...),
// nunca concatenación de texto, para evitar inyección SQL.
const { Pool, types } = require('pg');
const { databaseUrl } = require('./env');

// PostgreSQL devuelve NUMERIC como texto para no perder precisión.
// Como los precios tienen 2 decimales, es seguro convertirlos a número (OID 1700 = NUMERIC).
types.setTypeParser(1700, (valor) => parseFloat(valor));

const pool = new Pool({ connectionString: databaseUrl });

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = {
  query: (texto, parametros) => pool.query(texto, parametros),
  pool,
};
