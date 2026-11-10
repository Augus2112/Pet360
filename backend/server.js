const express = require('express');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const projectRoot = path.join(__dirname, '..');
const port = process.env.PORT || 3000;
const catalogPath = path.join(projectRoot, 'data', 'productos.json');

app.get('/api/catalogo', async (req, res, next) => {
  try {
    const catalog = await fs.readFile(catalogPath, 'utf8');
    res.json(JSON.parse(catalog));
  } catch (error) {
    next(error);
  }
});

app.use('/admin', express.static(path.join(projectRoot, 'public', 'admin')));
app.use('/cliente', express.static(path.join(projectRoot, 'public', 'cliente')));

app.get('/', (req, res) => {
  res.redirect('/cliente/');
});

app.use((error, req, res, next) => {
  console.error('Error al procesar la solicitud:', error);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Pet360 disponible en http://localhost:${port}`);
  });
}

module.exports = app;
