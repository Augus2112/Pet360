// Credenciales de acceso directo para el administrador
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

const STORAGE_KEY = 'productos_pet360';
const CATEGORIES_KEY = 'categorias_pet360';

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

// Cargar catálogo desde localStorage
function loadCatalog() {
  const storedProducts = localStorage.getItem(STORAGE_KEY);
  const storedCategories = localStorage.getItem(CATEGORIES_KEY);

  let productos = storedProducts ? JSON.parse(storedProducts) : [
    { id: 1, nombre: 'Alimento Perros 5kg', precio: 18.00, categoria: 'Alimento', descripcion: 'Alimento premium formulado para perros adultos...', imagen: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500' },
    { id: 2, nombre: 'Juguete Mordedera', precio: 4.50, categoria: 'Accesorios', descripcion: 'Juguete resistente de goma ideal...', imagen: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=500' }
  ];

  let categorias = storedCategories ? JSON.parse(storedCategories) : [
    { id: 1, nombre: 'Alimento' },
    { id: 2, nombre: 'Accesorios' },
    { id: 3, nombre: 'Gatos' }
  ];

  currentCatalog = { categorias, productos };
  renderCategories(categorias);
  renderProducts(productos, categorias);
}

function guardarEnStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCatalog.productos));
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(currentCatalog.categorias));
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
    option.value = category.nombre; // Guardamos el nombre como categoría para que coincida con la vista de cliente
    option.textContent = category.nombre;
    productCategory.append(option.cloneNode(true));
    editProductCategory.append(option);
  }
}

function renderProducts(products, categories) {
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

// Login directo en el cliente
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
    dashboardMessage.textContent = 'Sesión iniciada. Cargando catálogo...';
    loadCatalog();
    dashboardMessage.textContent = 'Sesión iniciada. Puedes administrar tu catálogo.';
  } else {
    formMessage.textContent = 'Usuario o contraseña incorrectos.';
  }
});

// Agregar categoría
categoryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombreCat = categoryInput.value.trim();
  if (!nombreCat) return;

  const nuevaCat = {
    id: Date.now(),
    nombre: nombreCat
  };

  currentCatalog.categorias.push(nuevaCat);
  guardarEnStorage();
  categoryForm.reset();
  loadCatalog();
  dashboardMessage.textContent = `Categoría "${nombreCat}" agregada.`;
});

// Gestionar Acciones en Categorías (Editar / Eliminar)
categoryList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const catId = Number(button.dataset.id);
  const category = currentCatalog.categorias.find((item) => item.id === catId);
  if (!category) return;

  if (button.dataset.action === 'edit-category') {
    editCategoryId.value = String(category.id);
    editCategoryName.value = category.nombre;
    editCategoryDialog.showModal();
    editCategoryName.focus();
    return;
  }

  if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return;

  currentCatalog.categorias = currentCatalog.categorias.filter(c => c.id !== catId);
  guardarEnStorage();
  loadCatalog();
  dashboardMessage.textContent = `Categoría "${category.nombre}" eliminada.`;
});

editCategoryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const catId = Number(editCategoryId.value);
  const nuevoNombre = editCategoryName.value.trim();

  const cat = currentCatalog.categorias.find(c => c.id === catId);
  if (cat) {
    cat.nombre = nuevoNombre;
    guardarEnStorage();
    editCategoryDialog.close();
    loadCatalog();
    dashboardMessage.textContent = `Categoría actualizada con éxito.`;
  }
});

// Función auxiliar para convertir archivo de imagen a Base64
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

// Agregar producto
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
    guardarEnStorage();
    productForm.reset();
    loadCatalog();
    dashboardMessage.textContent = `Producto "${nombre}" agregado correctamente.`;
  } catch (error) {
    dashboardMessage.textContent = 'Error al procesar la imagen.';
  } finally {
    submitButton.disabled = false;
  }
});

// Gestionar Acciones en Productos (Editar / Eliminar)
productList.addEventListener('click', (event) => {
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
    document.querySelector('#edit-product-name').focus();
    return;
  }

  if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) return;

  currentCatalog.productos = currentCatalog.productos.filter(p => p.id !== prodId);
  guardarEnStorage();
  loadCatalog();
  dashboardMessage.textContent = `Producto "${product.nombre}" eliminado.`;
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

    guardarEnStorage();
    editProductDialog.close();
    loadCatalog();
    dashboardMessage.textContent = `Producto "${nombre}" actualizado correctamente.`;
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