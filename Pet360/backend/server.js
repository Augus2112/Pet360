const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const { randomBytes, randomUUID, scryptSync, timingSafeEqual } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');

const projectRoot = path.join(__dirname, '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

const app = express();
const port = process.env.PORT || 3000;
const catalogPath = path.join(projectRoot, 'data', 'productos.json');
const credentialsDatabasePath = path.join(projectRoot, 'data', 'admin.sqlite');
const uploadDirectory = path.join(projectRoot, 'uploads');
const imageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);
let catalogWriteQueue = Promise.resolve();

if (!process.env.SESSION_SECRET) {
  throw new Error('Configura SESSION_SECRET en el archivo .env antes de iniciar el servidor.');
}

const credentialsDatabase = new DatabaseSync(credentialsDatabasePath);
credentialsDatabase.exec(`
  CREATE TABLE IF NOT EXISTS admin_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username TEXT NOT NULL UNIQUE,
    password_salt BLOB NOT NULL,
    password_hash BLOB NOT NULL
  )
`);
initializeAdminCredentials();

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '10kb' }));
app.use(session({
  name: 'pet360.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
      callback(null, `${randomUUID()}${imageTypes.get(file.mimetype)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!imageTypes.has(file.mimetype)) {
      return callback(new Error('La imagen debe ser JPG, PNG o WebP.'));
    }

    callback(null, true);
  },
});

app.get('/api/catalogo', async (req, res, next) => {
  try {
    const catalog = await fs.readFile(catalogPath, 'utf8');
    res.json(JSON.parse(catalog));
  } catch (error) {
    next(error);
  }
});

app.post('/api/categorias', requireAdmin, async (req, res, next) => {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';

  if (!nombre || nombre.length > 60) {
    return res.status(400).json({ error: 'El nombre debe tener entre 1 y 60 caracteres.' });
  }

  try {
    const category = await updateCatalog((catalog) => {
      if (catalog.categorias.some((item) => item.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'))) {
        return { error: 'Ya existe una categoría con ese nombre.' };
      }

      const id = catalog.categorias.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const created = { id, nombre };
      catalog.categorias.push(created);
      return { value: created };
    });

    if (category.error) {
      return res.status(409).json({ error: category.error });
    }

    res.status(201).json(category.value);
  } catch (error) {
    next(error);
  }
});

app.put('/api/categorias/:id', requireAdmin, async (req, res, next) => {
  const id = parseId(req.params.id);
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';

  if (!id || !nombre || nombre.length > 60) {
    return res.status(400).json({ error: 'El ID o nombre de categoría no es válido.' });
  }

  try {
    const category = await updateCatalog((catalog) => {
      const current = catalog.categorias.find((item) => item.id === id);
      if (!current) {
        return { error: 'No se encontró la categoría.', status: 404 };
      }

      if (catalog.categorias.some((item) => (
        item.id !== id && item.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es')
      ))) {
        return { error: 'Ya existe una categoría con ese nombre.', status: 409 };
      }

      current.nombre = nombre;
      return { value: current };
    });

    if (category.error) {
      return res.status(category.status).json({ error: category.error });
    }

    res.json(category.value);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/categorias/:id', requireAdmin, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El ID de categoría no es válido.' });
  }

  try {
    const result = await updateCatalog((catalog) => {
      const index = catalog.categorias.findIndex((item) => item.id === id);
      if (index === -1) {
        return { error: 'No se encontró la categoría.', status: 404 };
      }

      if (catalog.productos.some((product) => product.categoriaId === id)) {
        return {
          error: 'No puedes eliminar esta categoría porque tiene productos asociados.',
          status: 409,
        };
      }

      catalog.categorias.splice(index, 1);
      return { value: true };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/productos', requireAdmin, uploadImage.single('imagen'), async (req, res, next) => {
  const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
  const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';
  const precio = Number(req.body.precio);
  const categoriaId = Number(req.body.categoriaId);

  if (!nombre || nombre.length > 100) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: 'El nombre debe tener entre 1 y 100 caracteres.' });
    }, next);
  }

  if (descripcion.length > 1000) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: 'La descripción no puede superar 1000 caracteres.' });
    }, next);
  }

  if (!Number.isFinite(precio) || precio <= 0 || precio > 10000000) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: 'Ingresa un precio mayor que cero y menor a 10,000,000.' });
    }, next);
  }

  if (!Number.isSafeInteger(categoriaId)) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: 'Selecciona una categoría válida.' });
    }, next);
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.' });
  }

  try {
    if (!await hasValidImageSignature(req.file)) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: 'El archivo no coincide con un formato de imagen válido.' });
    }

    const product = await updateCatalog((catalog) => {
      if (!catalog.categorias.some((category) => category.id === categoriaId)) {
        return { error: 'La categoría seleccionada ya no existe.' };
      }

      const id = catalog.productos.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const created = {
        id,
        nombre,
        descripcion,
        precio,
        imagen: `/uploads/${req.file.filename}`,
        categoriaId,
      };
      catalog.productos.push(created);
      return { value: created };
    });

    if (product.error) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: product.error });
    }

    res.status(201).json(product.value);
  } catch (error) {
    await removeUploadedFile(req.file).catch((cleanupError) => {
      console.error('No se pudo limpiar la imagen tras un error:', cleanupError);
    });
    next(error);
  }
});

app.put('/api/productos/:id', requireAdmin, uploadImage.single('imagen'), async (req, res, next) => {
  const id = parseId(req.params.id);
  const values = readProductFields(req.body);

  if (!id) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: 'El ID de producto no es válido.' });
    }, next);
  }

  if (values.error) {
    return removeUploadedFile(req.file).then(() => {
      res.status(400).json({ error: values.error });
    }, next);
  }

  try {
    if (req.file && !await hasValidImageSignature(req.file)) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ error: 'El archivo no coincide con un formato de imagen válido.' });
    }

    const result = await updateCatalog((catalog) => {
      const current = catalog.productos.find((item) => item.id === id);
      if (!current) {
        return { error: 'No se encontró el producto.', status: 404 };
      }

      if (!catalog.categorias.some((category) => category.id === values.value.categoriaId)) {
        return { error: 'La categoría seleccionada ya no existe.', status: 400 };
      }

      const previousImage = current.imagen;
      Object.assign(current, values.value);
      if (req.file) {
        current.imagen = `/uploads/${req.file.filename}`;
      }

      return { value: current, previousImage: req.file ? previousImage : null };
    });

    if (result.error) {
      await removeUploadedFile(req.file);
      return res.status(result.status).json({ error: result.error });
    }

    const warning = result.previousImage
      ? await removeStoredImage(result.previousImage).catch((error) => {
        console.error('No se pudo eliminar la imagen anterior del producto:', error);
        return 'El producto se actualizó, pero no se pudo eliminar la imagen anterior.';
      })
      : null;

    res.json({ ...result.value, ...(warning ? { warning } : {}) });
  } catch (error) {
    await removeUploadedFile(req.file).catch((cleanupError) => {
      console.error('No se pudo limpiar la imagen tras un error:', cleanupError);
    });
    next(error);
  }
});

app.delete('/api/productos/:id', requireAdmin, async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'El ID de producto no es válido.' });
  }

  try {
    const result = await updateCatalog((catalog) => {
      const index = catalog.productos.findIndex((item) => item.id === id);
      if (index === -1) {
        return { error: 'No se encontró el producto.', status: 404 };
      }

      const [product] = catalog.productos.splice(index, 1);
      return { value: product };
    });

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const warning = await removeStoredImage(result.value.imagen).catch((error) => {
      console.error('No se pudo eliminar la imagen del producto:', error);
      return 'El producto se eliminó, pero no se pudo eliminar su imagen.';
    });

    res.json({ deleted: true, ...(warning ? { warning } : {}) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: req.session.isAdmin === true });
});

app.post('/api/admin/login', (req, res, next) => {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  if (username.length > 128 || password.length > 128) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  const credentials = credentialsDatabase.prepare(
    'SELECT username, password_salt, password_hash FROM admin_credentials WHERE id = ?',
  ).get(1);
  const usernameMatches = credentials && safeEqual(username, credentials.username);
  const passwordHash = credentials
    ? scryptSync(password, credentials.password_salt, credentials.password_hash.length)
    : Buffer.alloc(64);
  const storedPasswordHash = credentials ? Buffer.from(credentials.password_hash) : Buffer.alloc(64);
  const passwordMatches = timingSafeEqual(passwordHash, storedPasswordHash);

  if (!usernameMatches || !passwordMatches) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  req.session.regenerate((error) => {
    if (error) {
      return next(error);
    }

    req.session.isAdmin = true;
    req.session.save((saveError) => {
      if (saveError) {
        return next(saveError);
      }

      res.json({ authenticated: true });
    });
  });
});

app.post('/api/admin/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie('pet360.sid', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    res.status(204).end();
  });
});

app.use('/admin', express.static(path.join(projectRoot, 'public', 'admin')));
app.use('/cliente', express.static(path.join(projectRoot, 'public', 'cliente')));
app.use('/uploads', express.static(uploadDirectory));

app.get('/', (req, res) => {
  res.redirect('/cliente/');
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: error.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no puede superar los 5 MB.'
        : 'No se pudo procesar la imagen.',
    });
  }

  if (error.message === 'La imagen debe ser JPG, PNG o WebP.') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Error al procesar la solicitud:', error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Pet360 disponible en http://localhost:${port}`);
  });
}

module.exports = app;

function requireAdmin(req, res, next) {
  if (req.session.isAdmin === true) {
    return next();
  }

  res.status(401).json({ error: 'Inicia sesión para realizar esta acción.' });
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function readProductFields(body) {
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
  const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim() : '';
  const precio = Number(body.precio);
  const categoriaId = Number(body.categoriaId);

  if (!nombre || nombre.length > 100) {
    return { error: 'El nombre debe tener entre 1 y 100 caracteres.' };
  }

  if (descripcion.length > 1000) {
    return { error: 'La descripción no puede superar 1000 caracteres.' };
  }

  if (!Number.isFinite(precio) || precio <= 0 || precio > 10000000) {
    return { error: 'Ingresa un precio mayor que cero y menor a 10,000,000.' };
  }

  if (!Number.isSafeInteger(categoriaId)) {
    return { error: 'Selecciona una categoría válida.' };
  }

  return { value: { nombre, descripcion, precio, categoriaId } };
}

function updateCatalog(update) {
  const operation = catalogWriteQueue.then(async () => {
    const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
    const result = update(catalog);

    if (result.error) {
      return result;
    }

    const temporaryPath = `${catalogPath}.${process.pid}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, catalogPath);
    return result;
  });

  catalogWriteQueue = operation.catch(() => {});
  return operation;
}

async function removeUploadedFile(file) {
  if (file) {
    await fs.unlink(file.path);
  }
}

async function removeStoredImage(imageUrl) {
  const match = /^\/uploads\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/i.exec(imageUrl || '');
  if (!match) {
    return null;
  }

  const imagePath = path.join(uploadDirectory, match[1]);
  await fs.rm(imagePath, { force: true });
  return null;
}

async function hasValidImageSignature(file) {
  const handle = await fs.open(file.path, 'r');
  const header = Buffer.alloc(12);

  try {
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    const bytes = header.subarray(0, bytesRead);

    if (file.mimetype === 'image/jpeg') {
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }

    if (file.mimetype === 'image/png') {
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    return file.mimetype === 'image/webp'
      && bytes.length === 12
      && bytes.toString('ascii', 0, 4) === 'RIFF'
      && bytes.toString('ascii', 8, 12) === 'WEBP';
  } finally {
    await handle.close();
  }
}

function safeEqual(value, expected) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

function initializeAdminCredentials() {
  const existingAdmin = credentialsDatabase.prepare(
    'SELECT id FROM admin_credentials WHERE id = ?',
  ).get(1);

  if (existingAdmin) {
    return;
  }

  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASS;
  if (!username || !password) {
    throw new Error(
      'No hay credenciales de administrador en SQL. Configura ADMIN_USER y ADMIN_PASS en .env para inicializar la base de datos.',
    );
  }

  const salt = randomBytes(16);
  const passwordHash = scryptSync(password, salt, 64);
  credentialsDatabase.prepare(
    'INSERT INTO admin_credentials (id, username, password_salt, password_hash) VALUES (?, ?, ?, ?)',
  ).run(1, username, salt, passwordHash);
}
