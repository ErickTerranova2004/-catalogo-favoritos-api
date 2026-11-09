// Configuración de Express (sin arrancar el servidor, para poder reutilizarla).
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const favoritosRoutes = require('./routes/favoritos.routes');
const { rutaNoEncontrada, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');           // no revelar la tecnología del servidor
app.use(express.json({ limit: '10kb' })); // parsear JSON y limitar tamaño del cuerpo

app.get('/api/salud', (req, res) => res.json({ ok: true, data: { estado: 'activo' } }));

// Express 5 captura automáticamente los errores de las funciones async
// y los envía a errorHandler, por eso los controladores no necesitan try/catch genéricos.
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/favoritos', favoritosRoutes);

app.use(rutaNoEncontrada);
app.use(errorHandler);

module.exports = app;
