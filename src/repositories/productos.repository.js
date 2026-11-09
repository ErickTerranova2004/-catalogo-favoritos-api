// Acceso a datos de productos (CRUD). Solo SQL parametrizado.
const db = require('../config/db');

const COLUMNAS = 'id, nombre, descripcion, categoria, precio, creado_en, actualizado_en';

async function listar({ categoria } = {}) {
  if (categoria) {
    const { rows } = await db.query(
      `SELECT ${COLUMNAS} FROM productos WHERE LOWER(categoria) = LOWER($1) ORDER BY id`,
      [categoria]
    );
    return rows;
  }
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM productos ORDER BY id`);
  return rows;
}

async function buscarPorId(id) {
  const { rows } = await db.query(`SELECT ${COLUMNAS} FROM productos WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function crear({ nombre, descripcion, categoria, precio }) {
  const { rows } = await db.query(
    `INSERT INTO productos (nombre, descripcion, categoria, precio)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [nombre, descripcion, categoria, precio]
  );
  return rows[0];
}

// Devuelve null si el producto no existe (0 filas actualizadas).
async function actualizar(id, { nombre, descripcion, categoria, precio }) {
  const { rows } = await db.query(
    `UPDATE productos
        SET nombre = $1, descripcion = $2, categoria = $3, precio = $4, actualizado_en = NOW()
      WHERE id = $5
      RETURNING ${COLUMNAS}`,
    [nombre, descripcion, categoria, precio, id]
  );
  return rows[0] || null;
}

// Devuelve true si se eliminó. Los favoritos asociados se borran por ON DELETE CASCADE.
async function eliminar(id) {
  const { rowCount } = await db.query('DELETE FROM productos WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar };
