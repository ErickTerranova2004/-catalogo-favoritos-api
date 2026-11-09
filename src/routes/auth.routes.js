const { Router } = require('express');
const auth = require('../controllers/auth.controller');

const router = Router();

router.post('/registro', auth.registro); // Público
router.post('/login', auth.login);       // Público

module.exports = router;
