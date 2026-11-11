// Credenciales de acceso directo
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

// Configuración de JSONBin
const BIN_ID = '6af3e690ffd5d16053b85a92';
const API_KEY = '$2a$10$OnZ5OXF8hEQN4S6BEcNDTO2v3SzWKV1CDFQ1.yjYaYAOYB5kZWhd6'; // Reemplaza por tu Master Key de la pestaña API KEYS

const adminPage = document.querySelector('.admin-page');
const loginCard = document.querySelector('#login-card');
const adminIllustration = document.querySelector('#admin-illustration');
const loginForm = document.querySelector('#login-form');
const formMessage = document.querySelector('#form-message');
const loginButton = loginForm.querySelector('button[type="submit"]');
const dashboard = document.querySelector('#dashboard');
const dashboardMessage = document.querySelector('#dashboard-message');
const logoutButton = document.querySelector('#logout-button');
const categoryForm = document.querySelector('#category-form');
const categoryInput = document.querySelector('#category-name');
const categoryList = document.querySelector('#category-list');
const editCategoryDialog = document.querySelector('#edit-category-dialog');
const editCategoryForm = document.querySelector('#edit-category-form');
const editCategoryId = document.querySelector('#edit-category-id');
const editCategoryName = document.querySelector('#edit-category-name');
const productForm = document.querySelector('#product-form');
const productCategory = document.querySelector('#product-category');
const productList = document.querySelector('#product-list');
const emptyProducts = document.querySelector('#empty-products');
const editProductDialog = document.querySelector('#edit-product-dialog');
const editProductForm = document.querySelector('#edit-product-form');
const editProductCategory = document.querySelector('#edit-product-category');
const categoryPlaceholder = productCategory.querySelector('option').cloneNode(true);
const editCategoryPlaceholder = editProductCategory.querySelector('option').cloneNode(true);

let currentCatalog = { categorias: [], productos: [] };

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
});

function verificarSesion() {
  const sesionActiva = sessionStorage.getItem('admin_logged_in');
  if (sesionActiva === 'true') {
    showDashboard();
    loadCatalog();
  } else {
    showLogin();
  }
}

function showDashboard() {
  adminPage.classList.add('dashboard-active');
  loginCard.hidden = true;
  adminIllustration.hidden = true;
  dashboard.hidden = false;
}

function showLogin() {
  adminPage.classList.remove('dashboard-active');
  loginCard.hidden = false;
  adminIllustration.hidden = false;
  dashboard.hidden = true;
}

// Cargar catálogo desde JSONBin
async function loadCatalog() {
  dashboardMessage.textContent = 'Cargando catálogo desde la nube...';
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': API_KEY }
    });
    
    if (!res.ok) throw new Error('Error al conectar con la base de datos');

    const data = await res.json();
    currentCatalog.productos = data.record.productos || [];
    currentCatalog.categorias = data.record.categorias || [
      { id: 1, nombre: 'Alimento' },
      { id: 2, nombre: 'Accesorios' },
      { id: 3, nombre: 'Gatos' }
    ];

    renderCategories(currentCatalog.categorias);
    renderProducts(currentCatalog.productos);
    dashboardMessage.textContent = 'Catálogo actualizado en tiempo real.';
  } catch (e) {
    dashboardMessage.textContent = 'Error al cargar catálogo desde la nube.';
  }
}

// Guardar todo el objeto en JSONBin
async function guardarEnNube() {
  dashboardMessage.textContent = 'Guardando cambios en la nube...';
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(currentCatalog)
    });

    if (!res.ok) throw new Error('Error al guardar');
    dashboardMessage.textContent = '¡Cambios guardados con éxito en la nube!';
  } catch (e) {
    dashboardMessage.textContent = 'Error al guardar cambios en la nube.';
  }
}

function renderCategories(categories) {
  categoryList.replaceChildren();
  productCategory.replaceChildren(categoryPlaceholder.cloneNode(true));
  editProductCategory.replaceChildren(editCategoryPlaceholder.cloneNode(true));

  for (const category of categories) {
    const item = document.createElement('li');
    item.className = 'category-item';

    const name = document.createElement('span');
    name.textContent = category.nombre;

    const id = document.createElement('span');
    id.textContent = `#${category.id}`;

    const actions = document.createElement('div');
    actions.className = 'category-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit-category';
    editButton.dataset.id = String(category.id);
    editButton.textContent = 'Editar';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete-category';
    deleteButton.dataset.id = String(category.id);
    deleteButton.textContent = 'Eliminar';

    actions.append(editButton, deleteButton);
    item.append(name, id, actions);
    categoryList.append(item);

    const option = document.createElement('option');
    option.value = category.nombre;
    option.textContent = category.nombre;
    productCategory.append(option.cloneNode(true));
    editProductCategory.append(option);
  }
}

function renderProducts(products) {
  productList.replaceChildren();
  emptyProducts.hidden = products.length > 0;

  for (const product of products) {
    const item = document.createElement('li');
    item.className = 'product-item';

    const image = document.createElement('img');
    image.src = product.imagen || 'https://via.placeholder.com/240x170';
    image.alt = product.nombre;
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'product-info';

    const name = document.createElement('h3');
    name.textContent = product.nombre;

    const categoryName = document.createElement('p');
    categoryName.textContent = product.categoria ? `Categoría: ${product.categoria}` : 'Sin categoría';

    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = `$${Number(product.precio).toFixed(2)}`;

    const actions = document.createElement('div');
    actions.className = 'product-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.dataset.action = 'edit-product';
    editButton.dataset.id = String(product.id);
    editButton.textContent = 'Editar';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.dataset.action = 'delete-product';
    deleteButton.dataset.id = String(product.id);
    deleteButton.textContent = 'Eliminar';

    actions.append(editButton, deleteButton);
    info.append(name, categoryName, price, actions);
    item.append(image, info);
    productList.append(item);
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const formData = new FormData(loginForm);
  const user = formData.get('username');
  const pass = formData.get('password');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('admin_logged_in', 'true');
    loginForm.reset();
    showDashboard();
    loadCatalog();
  } else {
    formMessage.textContent = 'Usuario o contraseña incorrectos.';
  }
});

categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nombreCat = categoryInput.value.trim();
  if (!nombreCat) return;

  const nuevaCat = { id: Date.now(), nombre: nombreCat };
  currentCatalog.categorias.push(nuevaCat);

  categoryForm.reset();
  renderCategories(currentCatalog.categorias);
  await guardarEnNube();
});

categoryList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const catId = Number(button.dataset.id);
  const category = currentCatalog.categorias.find((item) => item.id === catId);
  if (!category) return;

  if (button.dataset.action === 'edit-category') {
    editCategoryId.value = String(category.id);
    editCategoryName.value = category.nombre;
    editCategoryDialog.showModal();
    return;
  }

  if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return;

  currentCatalog.categorias = currentCatalog.categorias.filter(c => c.id !== catId);
  renderCategories(currentCatalog.categorias);
  await guardarEnNube();
});

editCategoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const catId = Number(editCategoryId.value);
  const nuevoNombre = editCategoryName.value.trim();

  const cat = currentCatalog.categorias.find(c => c.id === catId);
  if (cat) {
    cat.nombre = nuevoNombre;
    editCategoryDialog.close();
    renderCategories(currentCatalog.categorias);
    await guardarEnNube();
  }
});

function convertirImagenABase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('https://via.placeholder.com/240x170');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = productForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  const nombre = document.getElementById('product-name').value;
  const descripcion = document.getElementById('product-description').value;
  const precio = parseFloat(document.getElementById('product-price').value);
  const categoria = productCategory.value;
  const imageFile = document.getElementById('product-image').files[0];

  try {
    const imagenBase64 = await convertirImagenABase64(imageFile);

    const nuevoProducto = {
      id: Date.now(),
      nombre,
      descripcion,
      precio,
      categoria,
      imagen: imagenBase64
    };

    currentCatalog.productos.push(nuevoProducto);
    productForm.reset();
    renderProducts(currentCatalog.productos);
    await guardarEnNube();
  } catch (error) {
    dashboardMessage.textContent = 'Error al procesar la imagen.';
  } finally {
    submitButton.disabled = false;
  }
});

productList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const prodId = Number(button.dataset.id);
  const product = currentCatalog.productos.find((item) => item.id === prodId);
  if (!product) return;

  if (button.dataset.action === 'edit-product') {
    document.querySelector('#edit-product-id').value = String(product.id);
    document.querySelector('#edit-product-name').value = product.nombre;
    document.querySelector('#edit-product-description').value = product.descripcion || '';
    document.querySelector('#edit-product-price').value = String(product.precio);
    editProductCategory.value = product.categoria;
    document.querySelector('#edit-product-image').value = '';
    editProductDialog.showModal();
    return;
  }

  if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) return;

  currentCatalog.productos = currentCatalog.productos.filter(p => p.id !== prodId);
  renderProducts(currentCatalog.productos);
  await guardarEnNube();
});

editProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prodId = Number(document.querySelector('#edit-product-id').value);
  const nombre = document.querySelector('#edit-product-name').value;
  const descripcion = document.querySelector('#edit-product-description').value;
  const precio = parseFloat(document.querySelector('#edit-product-price').value);
  const categoria = editProductCategory.value;
  const imageFile = document.querySelector('#edit-product-image').files[0];

  const product = currentCatalog.productos.find(p => p.id === prodId);
  if (!product) return;

  try {
    let imagenBase64 = product.imagen;
    if (imageFile) {
      imagenBase64 = await convertirImagenABase64(imageFile);
    }

    product.nombre = nombre;
    product.descripcion = descripcion;
    product.precio = precio;
    product.categoria = categoria;
    product.imagen = imagenBase64;

    editProductDialog.close();
    renderProducts(currentCatalog.productos);
    await guardarEnNube();
  } catch (error) {
    dashboardMessage.textContent = 'Error al actualizar el producto.';
  }
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(`#${button.dataset.closeDialog}`).close();
  });
});

logoutButton.addEventListener('click', () => {
  sessionStorage.removeItem('admin_logged_in');
  showLogin();
  dashboardMessage.textContent = '';
});