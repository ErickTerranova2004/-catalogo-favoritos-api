// Acceso a datos de favoritos.
// IMPORTANTE: todas las consultas filtran por usuario_id, que siempre viene del token.
// Así un usuario nunca puede leer ni borrar favoritos de otro.
const db = require('../config/db');

async function listarPorUsuario(usuarioId) {
  const { rows } = await db.query(
    `SELECT p.id, p.nombre, p.descripcion, p.categoria, p.precio, f.agregado_en
       FROM favoritos f
       JOIN productos p ON p.id = f.producto_id
      WHERE f.usuario_id = $1
      ORDER BY f.agregado_en DESC, p.id`,
    [usuarioId]
  );
  return rows;
}

// Si ya existe (PK duplicada) PostgreSQL lanza 23505; si el producto no existe, 23503.
// Esos códigos se traducen a 409 y 404 en el controlador.
async function agregar(usuarioId, productoId) {
  const { rows } = await db.query(
    `INSERT INTO favoritos (usuario_id, producto_id)
     VALUES ($1, $2)
     RETURNING usuario_id, producto_id, agregado_en`,
    [usuarioId, productoId]
  );
  return rows[0];
}

// Solo borra si el favorito pertenece a ESE usuario.
async function eliminar(usuarioId, productoId) {
  const { rowCount } = await db.query(
    'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
    [usuarioId, productoId]
  );
  return rowCount > 0;
}

module.exports = { listarPorUsuario, agregar, eliminar };
