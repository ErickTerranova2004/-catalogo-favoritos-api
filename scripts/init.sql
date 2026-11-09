-- =====================================================================
-- Esquema de la base de datos: Catálogo de productos con favoritos
-- Es idempotente: se puede ejecutar varias veces sin borrar datos.
-- =====================================================================

-- ---------- USUARIOS ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(100)  NOT NULL,
  correo         VARCHAR(255)  NOT NULL UNIQUE,          -- correo único
  password_hash  VARCHAR(100)  NOT NULL,                 -- nunca la contraseña en texto plano
  rol            VARCHAR(20)   NOT NULL DEFAULT 'usuario'
                 CHECK (rol IN ('usuario', 'admin')),
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ---------- PRODUCTOS ----------
CREATE TABLE IF NOT EXISTS productos (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120)   NOT NULL,
  descripcion     TEXT           NOT NULL,
  categoria       VARCHAR(60)    NOT NULL,
  precio          NUMERIC(10, 2) NOT NULL CHECK (precio > 0),  -- precio mayor que cero
  creado_en       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos (LOWER(categoria));

-- ---------- FAVORITOS (relación usuario <-> producto) ----------
-- PRIMARY KEY compuesta: impide duplicados (mismo usuario + mismo producto).
-- ON DELETE CASCADE: si se elimina un producto (o un usuario), sus favoritos
-- se eliminan automáticamente, así no quedan referencias huérfanas.
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id   INTEGER     NOT NULL REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id  INTEGER     NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  agregado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, producto_id)
);

-- ---------- DATOS DE EJEMPLO (ficticios) ----------
-- Solo se insertan si la tabla de productos está vacía.
INSERT INTO productos (nombre, descripcion, categoria, precio)
SELECT * FROM (VALUES
  ('Laptop Andina 14',       'Portátil de 14 pulgadas, 16 GB RAM, 512 GB SSD', 'tecnologia', 849.99),
  ('Audífonos Cóndor BT',    'Audífonos inalámbricos con cancelación de ruido', 'tecnologia', 59.90),
  ('Mouse Ergonómico Pico',  'Mouse vertical inalámbrico recargable',           'tecnologia', 24.50),
  ('Café de Loja 500 g',     'Café de altura tostado medio, molido',            'alimentos',  8.75),
  ('Chocolate Amazónico 70%','Barra de cacao fino de aroma, 100 g',             'alimentos',  3.20),
  ('Novela El Volcán',       'Novela ficticia de aventura, tapa blanda',        'libros',     15.00),
  ('Mochila Chimborazo 25L', 'Mochila impermeable para senderismo',            'deportes',   42.00)
) AS datos(nombre, descripcion, categoria, precio)
WHERE NOT EXISTS (SELECT 1 FROM productos);
