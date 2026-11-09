const { Router } = require('express');
const productos = require('../controllers/productos.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

// Consulta pública (sin token)
router.get('/', productos.listar);
router.get('/:id', productos.obtener);

// Modificación: primero se verifica el token (401) y luego el rol admin (403)
router.post('/', verificarToken, requiereRol('admin'), productos.crear);
router.put('/:id', verificarToken, requiereRol('admin'), productos.actualizar);
router.delete('/:id', verificarToken, requiereRol('admin'), productos.eliminar);

module.exports = router;
