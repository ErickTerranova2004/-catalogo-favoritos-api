// Controlador del catálogo: recibe la petición, valida, llama al repositorio y responde.
const productosRepo = require('../repositories/productos.repository');
const { validarProducto } = require('../validators/producto.validator');
const { parsearId } = require('../validators/comunes');
const ApiError = require('../utils/ApiError');
const { enviar } = require('../utils/respuesta');

// GET /api/productos?categoria=tecnologia  (público)
async function listar(req, res) {
  let { categoria } = req.query;
  if (categoria !== undefined) {
    if (typeof categoria !== 'string' || categoria.trim() === '') {
      throw ApiError.badRequest("El filtro 'categoria' no puede estar vacío");
    }
    categoria = categoria.trim();
  }
  const productos = await productosRepo.listar({ categoria });
  enviar(res, 200, { total: productos.length, productos });
}

// GET /api/productos/:id  (público)
async function obtener(req, res) {
  const id = parsearId(req.params.id);
  const producto = await productosRepo.buscarPorId(id);
  if (!producto) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  enviar(res, 200, { producto });
}

// POST /api/productos  (solo admin)
async function crear(req, res) {
  const datos = validarProducto(req.body);
  const producto = await productosRepo.crear(datos);
  res.location(`/api/productos/${producto.id}`);
  enviar(res, 201, { producto });
}

// PUT /api/productos/:id  (solo admin)
async function actualizar(req, res) {
  const id = parsearId(req.params.id);
  const datos = validarProducto(req.body);
  const producto = await productosRepo.actualizar(id, datos);
  if (!producto) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  enviar(res, 200, { producto });
}

// DELETE /api/productos/:id  (solo admin)
// Sus favoritos se eliminan automáticamente (ON DELETE CASCADE en la BD).
async function eliminar(req, res) {
  const id = parsearId(req.params.id);
  const eliminado = await productosRepo.eliminar(id);
  if (!eliminado) throw ApiError.noEncontrado(`No existe un producto con id ${id}`);
  res.status(204).end();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
