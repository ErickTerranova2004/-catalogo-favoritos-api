# Catálogo de productos con favoritos y acceso por roles

API REST con **Node.js + Express + PostgreSQL** que gestiona un catálogo de productos y la lista de favoritos de cada usuario, con autenticación **JWT** y autorización por **roles** (`usuario` y `admin`).

## Integrantes

| Integrante | Usuario GitHub | Aportes principales |
|---|---|---|
| _Nombre Apellido 1_ | _@usuario1_ | _Ej.: modelo de datos, CRUD de productos, validaciones_ |
| _Nombre Apellido 2_ | _@usuario2_ | _Ej.: autenticación JWT, roles, favoritos, pruebas Postman_ |

## Propósito

- Cualquier persona puede **consultar el catálogo** y filtrarlo por categoría, sin iniciar sesión.
- Solo el **administrador** puede crear, actualizar y eliminar productos.
- Cada **usuario autenticado** gestiona su propia lista de favoritos y no puede ver ni modificar la de otros.

## Elección de base de datos: PostgreSQL (`pg`)

Elegimos PostgreSQL porque el problema es **relacional**: los favoritos son una relación muchos a muchos entre usuarios y productos, y la base de datos puede garantizar la integridad por sí misma:

| Requisito | Cómo lo garantiza PostgreSQL |
|---|---|
| Correo único | `UNIQUE (correo)` en `usuarios` |
| Precio mayor que cero | `CHECK (precio > 0)` en `productos` |
| Favoritos sin duplicados | `PRIMARY KEY (usuario_id, producto_id)` en `favoritos` |
| Rechazar productos inexistentes | `FOREIGN KEY ... REFERENCES productos(id)` |
| Consistencia al eliminar un producto | `ON DELETE CASCADE`: sus favoritos se eliminan automáticamente |

Así, aunque la API tenga un error, la base de datos nunca queda inconsistente. Todas las consultas son **parametrizadas** (`$1, $2...`) para evitar inyección SQL.

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- PostgreSQL 14 o superior
- Postman (o Newman, que se instala con `npm ci`)

## Instalación

```bash
git clone https://github.com/USUARIO/catalogo-favoritos-api.git
cd catalogo-favoritos-api
npm ci                      # instala exactamente las versiones de package-lock.json
cp .env.example .env        # en Windows: copy .env.example .env
```

Crea la base de datos vacía (una sola vez):

```bash
psql -U postgres -c "CREATE DATABASE catalogo_db;"
```

## Variables de entorno

Edita `.env` (nunca se sube al repositorio):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgres://postgres:clave@localhost:5432/catalogo_db` |
| `JWT_SECRET` | Secreto para firmar los tokens (mín. 32 caracteres) | genera uno con el comando de abajo |
| `JWT_EXPIRES_IN` | Vigencia del token | `1h` |
| `BCRYPT_ROUNDS` | Costo del hash de contraseñas | `10` |
| `ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Datos del administrador inicial | `admin@catalogo.local` |

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Inicialización de datos y del administrador

```bash
npm run db:init       # crea las tablas y carga 7 productos de ejemplo (no borra datos existentes)
npm run admin:crear   # crea el administrador con ADMIN_EMAIL / ADMIN_PASSWORD del .env
```

- El script SQL está en [`scripts/init.sql`](scripts/init.sql).
- **El rol admin solo se obtiene con `npm run admin:crear`**. El registro público siempre crea usuarios con rol `usuario`, aunque el cliente envíe `"rol": "admin"`.
- `npm run db:reset` borra todas las tablas y las vuelve a crear (útil para empezar de cero).

## Ejecución

```bash
npm start      # producción
npm run dev    # desarrollo, se reinicia al guardar cambios (nodemon)
```

La API queda en `http://localhost:3000/api`. Comprobación rápida: `GET /api/salud`.

## Estructura del proyecto

```
src/
  config/        env.js (variables de entorno) y db.js (pool de PostgreSQL)
  routes/        definen URL, método y middlewares de cada endpoint
  controllers/   lógica de cada endpoint: validar, llamar al repositorio, responder
  repositories/  acceso a datos: únicamente consultas SQL parametrizadas
  middlewares/   auth.js (verificarToken, requiereRol) y errorHandler.js
  validators/    validación de cuerpos y parámetros
  utils/         ApiError (errores controlados) y formato de respuesta
  app.js         configuración de Express
  server.js      punto de entrada
scripts/         init.sql, initDb.js, crearAdmin.js
postman/         colección y entorno de ejemplo
```

Flujo de una petición: **Postman → ruta → middlewares (token, rol) → controlador → validador → repositorio → PostgreSQL → respuesta JSON**.

## Formato de respuestas

Éxito:
```json
{ "ok": true, "data": { ... } }
```
Error:
```json
{ "ok": false, "error": { "codigo": "VALIDACION", "mensaje": "Los datos enviados no son válidos", "detalles": [ { "campo": "precio", "mensaje": "El precio debe ser mayor que cero" } ] } }
```
Los errores nunca incluyen trazas, consultas SQL ni secretos. Los errores inesperados devuelven `500` con un mensaje genérico y el detalle solo se registra en la consola del servidor.

## Rutas

Todas usan el prefijo `/api`. Las rutas protegidas requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Cuerpo | Respuesta exitosa | Errores posibles |
|---|---|---|---|---|---|
| POST | `/auth/registro` | Público | `{ "nombre", "correo", "password" }` | `201` `{ usuario }` | 400, 409 correo duplicado, 422 |
| POST | `/auth/login` | Público | `{ "correo", "password" }` | `200` `{ token, tipo, expiraEn, usuario }` | 400, 401 credenciales, 422 |
| GET | `/productos?categoria=x` | Público | — | `200` `{ total, productos }` | 400 filtro vacío |
| GET | `/productos/:id` | Público | — | `200` `{ producto }` | 400 id inválido, 404 |
| POST | `/productos` | Admin | `{ "nombre", "descripcion", "categoria", "precio" }` | `201` `{ producto }` | 400, 401, 403, 422 |
| PUT | `/productos/:id` | Admin | igual que POST (reemplazo completo) | `200` `{ producto }` | 400, 401, 403, 404, 422 |
| DELETE | `/productos/:id` | Admin | — | `204` sin cuerpo | 400, 401, 403, 404 |
| GET | `/favoritos` | Autenticado | — | `200` `{ total, favoritos }` | 401 |
| POST | `/favoritos` | Autenticado | `{ "productoId": 3 }` | `201` `{ favorito }` | 401, 404 producto inexistente, 409 duplicado, 422 |
| DELETE | `/favoritos/:productoId` | Autenticado | — | `204` sin cuerpo | 400, 401, 404 no está en tus favoritos |

**Reglas de validación**

- `nombre` y `correo` obligatorios; correo con formato válido; `password` entre 8 y 72 caracteres.
- Producto: `nombre`, `descripcion` y `categoria` obligatorios y no vacíos; `precio` **numérico**, mayor que 0 y con máximo 2 decimales. La categoría se guarda en minúsculas y el filtro no distingue mayúsculas.
- Se aceptan solo los campos permitidos: cualquier otro campo (por ejemplo `rol`, `id` o `usuarioId`) se ignora.

### Criterio de códigos de estado

| Código | Cuándo se usa |
|---|---|
| `200` | Consultas y actualizaciones exitosas, login |
| `201` | Creación (registro, producto, favorito) |
| `204` | Eliminación exitosa (sin cuerpo) |
| `400` | **Petición mal formada**: JSON roto, cuerpo que no es un objeto, id de la URL que no es un entero positivo |
| `401` | Sin token, token vencido, token con firma inválida o credenciales incorrectas |
| `403` | Token válido pero sin el rol necesario (usuario intentando modificar el catálogo) |
| `404` | Producto o favorito inexistente, o ruta inexistente |
| `409` | Conflicto con datos existentes: correo ya registrado, favorito duplicado |
| `422` | **JSON bien formado pero con contenido inválido**: campos vacíos, correo inválido, precio ≤ 0 o no numérico |

### Decisiones de diseño

- **Eliminar un producto elimina sus favoritos** (`ON DELETE CASCADE`). Un favorito de un producto que ya no existe no tiene sentido; así no quedan referencias huérfanas.
- **Identidad desde el token**: en favoritos, el usuario siempre es `req.usuario.id`, obtenido del JWT verificado. Si el cliente envía `usuarioId`, se ignora.
- **Quitar un favorito ajeno responde 404**, no 403: para B, ese favorito simplemente no existe en su lista, y así no se revela información de A.
- **El rol se lee de la base de datos en cada petición** protegida (no solo del token): si se le quita el rol admin a alguien, su token anterior deja de servir para administrar.
- **Login con mensaje genérico**: no se indica si el correo existe o si la contraseña es incorrecta, y el tiempo de respuesta es el mismo en ambos casos.
- El JWT se verifica fijando el algoritmo `HS256`, lo que rechaza tokens con `"alg": "none"`.

## Pruebas con Postman

La colección [`postman/catalogo.postman_collection.json`](postman/catalogo.postman_collection.json) tiene **58 peticiones y 121 aserciones**, organizadas en carpetas:

| Carpeta | Qué demuestra |
|---|---|
| 01 Autenticación | Registro y login correctos, correo duplicado (409), credenciales incorrectas (401), registro con `rol: admin` ignorado |
| 02 Catálogo público | Listar sin token, filtro por categoría, producto inexistente (404), id inválido (400) |
| 03 CRUD admin | Crear (201), consultar, actualizar (200), eliminar (204), consultar eliminado (404) |
| 04 Validaciones | Precio negativo, cero o texto (422), campos vacíos (422), JSON roto (400) |
| 05 Seguridad | Sin token (401), token vencido (401), token alterado (401), rol usuario modificando catálogo (403) |
| 06 Favoritos | Agregar (201), listar, duplicado (409), producto inexistente (404), quitar (204) |
| 07 Aislamiento A/B | B no ve ni puede quitar favoritos de A; el favorito de A permanece |
| 08 Consistencia | Al eliminar un producto desaparece de los favoritos |
| 09 Persistencia | Tras reiniciar el servidor, usuario, producto y favorito siguen existiendo |

### Pasos (Postman)

1. Inicia la API (`npm start`) con la base inicializada y el admin creado.
2. Importa en Postman la colección y el entorno `postman/catalogo.postman_environment.example.json`.
3. En el entorno, completa en **Current value** (no se exporta):
   - `admin_password`: el mismo valor de `ADMIN_PASSWORD` de tu `.env`.
   - `jwt_secret`: el mismo valor de `JWT_SECRET` de tu `.env`. Solo lo usa la prueba de **token vencido**, que genera en Postman un token correctamente firmado pero con fecha de expiración pasada.
4. Selecciona el entorno y ejecuta la colección completa con **Run collection** (en orden). Los correos de los usuarios A y B se generan con marca de tiempo, así que puede ejecutarse muchas veces.
5. **Persistencia**: detén el servidor (`Ctrl+C`), vuelve a iniciarlo con `npm start` y ejecuta solo la carpeta **09 - Persistencia**.

### Pasos (línea de comandos, con Newman)

```bash
cp postman/catalogo.postman_environment.example.json postman/local.postman_environment.json
# completa admin_password y jwt_secret en postman/local.postman_environment.json (está en .gitignore)

npm run test:postman        # ejecuta las 58 peticiones y guarda las variables del entorno
# Ctrl+C en la terminal del servidor, luego npm start de nuevo
npm run test:persistencia   # ejecuta solo la carpeta 09 tras el reinicio
```

## Seguridad y datos

- Contraseñas guardadas con **bcrypt**; nunca se devuelven ni la contraseña ni su hash.
- `.env`, `node_modules` y el entorno local de Postman están en `.gitignore`.
- Todos los datos son ficticios (correos `@prueba.local` y `@catalogo.local`).

## Recursos y herramientas de apoyo

- Documentación oficial de [Express 5](https://expressjs.com/), [node-postgres](https://node-postgres.com/), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) y [bcryptjs](https://github.com/dcodeIO/bcrypt.js).
- [Postman](https://learning.postman.com/) y [Newman](https://github.com/postmanlabs/newman) para las pruebas.
- _Indiquen aquí si usaron asistentes de IA u otras herramientas, y qué partes revisaron y adaptaron._
