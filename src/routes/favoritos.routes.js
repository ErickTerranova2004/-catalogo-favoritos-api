const { Router } = require('express');
const favoritos = require('../controllers/favoritos.controller');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de favoritos requieren estar autenticado (cualquier rol).
router.use(verificarToken);

router.get('/', favoritos.listar);
router.post('/', favoritos.agregar);
router.delete('/:productoId', favoritos.quitar);

module.exports = router;
