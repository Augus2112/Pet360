// Credenciales de acceso directo
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

// Configuración de SheetDB (Google Sheets)
const SHEETDB_URL = 'https://sheetdb.io/api/v1/xqcm1sjvwwpno';

const adminPage = document.querySelector('.admin-page');
const loginCard = document.querySelector('#login-card');
const adminIllustration = document.querySelector('#admin-illustration');
const loginForm = document.querySelector('#login-form');
const formMessage = document.querySelector('#form-message');
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
const categoryPlaceholder = productCategory ? productCategory.querySelector('option').cloneNode(true) : null;
const editCategoryPlaceholder = editProductCategory ? editProductCategory.querySelector('option').cloneNode(true) : null;

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
  if (adminPage) adminPage.classList.add('dashboard-active');
  if (loginCard) loginCard.hidden = true;
  if (adminIllustration) adminIllustration.hidden = true;
  if (dashboard) dashboard.hidden = false;
}

function showLogin() {
  if (adminPage) adminPage.classList.remove('dashboard-active');
  if (loginCard) loginCard.hidden = false;
  if (adminIllustration) adminIllustration.hidden = false;
  if (dashboard) dashboard.hidden = true;
}

// Manejador del Login
if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formMessage) formMessage.textContent = '';

    const formData = new FormData(loginForm);
    const user = formData.get('username');
    const pass = formData.get('password');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem('admin_logged_in', 'true');
      loginForm.reset();
      showDashboard();
      loadCatalog();
    } else {
      if (formMessage) {
        formMessage.textContent = 'Usuario o contraseña incorrectos.';
        formMessage.style.color = '#ef4444';
      }
    }
  });
}

// Cargar catálogo desde Google Sheets (SheetDB)
async function loadCatalog() {
  if (dashboardMessage) dashboardMessage.textContent = 'Cargando catálogo desde Google Sheets...';
  try {
    const [resProd, resCat] = await Promise.all([
      fetch(`${SHEETDB_URL}?sheet=productos`),
      fetch(`${SHEETDB_URL}?sheet=categorias`)
    ]);
    
    if (!resProd.ok || !resCat.ok) throw new Error('Error al conectar con Google Sheets');

    const productosData = await resProd.json();
    const categoriasData = await resCat.json();

    currentCatalog.productos = Array.isArray(productosData) ? productosData : [];
    currentCatalog.categorias = Array.isArray(categoriasData) ? categoriasData : [];

    renderCategories(currentCatalog.categorias);
    renderProducts(currentCatalog.productos);
    if (dashboardMessage) dashboardMessage.textContent = 'Catálogo sincronizado con Google Sheets.';
  } catch (e) {
    console.error(e);
    if (dashboardMessage) dashboardMessage.textContent = 'Error al cargar catálogo desde Google Sheets.';
  }
}

function renderCategories(categories) {
  if (!categoryList) return;
  categoryList.replaceChildren();
  if (productCategory && categoryPlaceholder) productCategory.replaceChildren(categoryPlaceholder.cloneNode(true));
  if (editProductCategory && editCategoryPlaceholder) editProductCategory.replaceChildren(editCategoryPlaceholder.cloneNode(true));

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

    if (productCategory) {
      const option = document.createElement('option');
      option.value = category.nombre;
      option.textContent = category.nombre;
      productCategory.append(option.cloneNode(true));
      if (editProductCategory) editProductCategory.append(option);
    }
  }
}

function renderProducts(products) {
  if (!productList) return;
  productList.replaceChildren();
  if (emptyProducts) emptyProducts.hidden = products.length > 0;

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

// Agregar Categoría
if (categoryForm) {
  categoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nombreCat = categoryInput.value.trim();
    if (!nombreCat) return;

    const nuevaCat = { id: Date.now().toString(), nombre: nombreCat };

    if (dashboardMessage) dashboardMessage.textContent = 'Guardando categoría...';
    try {
      const res = await fetch(`${SHEETDB_URL}?sheet=categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [nuevaCat] })
      });

      if (!res.ok) throw new Error('Error al guardar categoría');

      currentCatalog.categorias.push(nuevaCat);
      categoryForm.reset();
      renderCategories(currentCatalog.categorias);
      if (dashboardMessage) dashboardMessage.textContent = '¡Categoría guardada con éxito!';
    } catch (e) {
      console.error(e);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al guardar categoría en Google Sheets.';
    }
  });
}

if (categoryList) {
  categoryList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const catId = String(button.dataset.id);
    const category = currentCatalog.categorias.find((item) => String(item.id) === catId);
    if (!category) return;

    if (button.dataset.action === 'edit-category') {
      editCategoryId.value = catId;
      editCategoryName.value = category.nombre;
      editCategoryDialog.showModal();
      return;
    }

    if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return;

    if (dashboardMessage) dashboardMessage.textContent = 'Eliminando categoría...';
    try {
      const res = await fetch(`${SHEETDB_URL}/id/${catId}?sheet=categorias`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar');

      currentCatalog.categorias = currentCatalog.categorias.filter(c => String(c.id) !== catId);
      renderCategories(currentCatalog.categorias);
      if (dashboardMessage) dashboardMessage.textContent = 'Categoría eliminada con éxito.';
    } catch (e) {
      console.error(e);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al eliminar categoría.';
    }
  });
}

if (editCategoryForm) {
  editCategoryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const catId = String(editCategoryId.value);
    const nuevoNombre = editCategoryName.value.trim();

    if (dashboardMessage) dashboardMessage.textContent = 'Actualizando categoría...';
    try {
      const res = await fetch(`${SHEETDB_URL}/id/${catId}?sheet=categorias`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { nombre: nuevoNombre } })
      });

      if (!res.ok) throw new Error('Error al actualizar');

      const cat = currentCatalog.categorias.find(c => String(c.id) === catId);
      if (cat) cat.nombre = nuevoNombre;

      editCategoryDialog.close();
      renderCategories(currentCatalog.categorias);
      if (dashboardMessage) dashboardMessage.textContent = 'Categoría actualizada con éxito.';
    } catch (e) {
      console.error(e);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al actualizar categoría.';
    }
  });
}

// Agregar Producto
if (productForm) {
  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = productForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    if (dashboardMessage) dashboardMessage.textContent = 'Guardando producto...';

    const nombre = document.getElementById('product-name').value;
    const descripcion = document.getElementById('product-description').value;
    const precio = parseFloat(document.getElementById('product-price').value);
    const categoria = productCategory.value;
    const imagenInput = document.getElementById('product-image');
    
    // Soporta tanto campo URL como input local si luego deciden conectarlo
    const imagenUrl = imagenInput ? (imagenInput.value || 'https://via.placeholder.com/240x170') : 'https://via.placeholder.com/240x170';

    try {
      const nuevoProducto = {
        id: Date.now().toString(),
        nombre,
        descripcion,
        precio,
        categoria,
        imagen: imagenUrl
      };

      const res = await fetch(`${SHEETDB_URL}?sheet=productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [nuevoProducto] })
      });

      if (!res.ok) throw new Error('Error al guardar el producto');

      currentCatalog.productos.push(nuevoProducto);
      productForm.reset();
      renderProducts(currentCatalog.productos);
      if (dashboardMessage) dashboardMessage.textContent = '¡Producto guardado con éxito en Google Sheets!';
    } catch (error) {
      console.error(error);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al guardar el producto.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (productList) {
  productList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const prodId = String(button.dataset.id);
    const product = currentCatalog.productos.find((item) => String(item.id) === prodId);
    if (!product) return;

    if (button.dataset.action === 'edit-product') {
      document.querySelector('#edit-product-id').value = prodId;
      document.querySelector('#edit-product-name').value = product.nombre;
      document.querySelector('#edit-product-description').value = product.descripcion || '';
      document.querySelector('#edit-product-price').value = String(product.precio);
      if (editProductCategory) editProductCategory.value = product.categoria;
      editProductDialog.showModal();
      return;
    }

    if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) return;

    if (dashboardMessage) dashboardMessage.textContent = 'Eliminando producto...';
    try {
      const res = await fetch(`${SHEETDB_URL}/id/${prodId}?sheet=productos`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar');

      currentCatalog.productos = currentCatalog.productos.filter(p => String(p.id) !== prodId);
      renderProducts(currentCatalog.productos);
      if (dashboardMessage) dashboardMessage.textContent = 'Producto eliminado con éxito.';
    } catch (e) {
      console.error(e);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al eliminar producto.';
    }
  });
}

if (editProductForm) {
  editProductForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prodId = String(document.querySelector('#edit-product-id').value);
    const nombre = document.querySelector('#edit-product-name').value;
    const descripcion = document.querySelector('#edit-product-description').value;
    const precio = parseFloat(document.querySelector('#edit-product-price').value);
    const categoria = editProductCategory.value;

    const product = currentCatalog.productos.find(p => String(p.id) === prodId);
    if (!product) return;

    if (dashboardMessage) dashboardMessage.textContent = 'Actualizando producto...';
    try {
      const datosActualizados = {
        nombre,
        descripcion,
        precio,
        categoria,
        imagen: product.imagen
      };

      const res = await fetch(`${SHEETDB_URL}/id/${prodId}?sheet=productos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: datosActualizados })
      });

      if (!res.ok) throw new Error('Error al actualizar');

      product.nombre = nombre;
      product.descripcion = descripcion;
      product.precio = precio;
      product.categoria = categoria;

      editProductDialog.close();
      renderProducts(currentCatalog.productos);
      if (dashboardMessage) dashboardMessage.textContent = 'Producto actualizado con éxito.';
    } catch (error) {
      console.error(error);
      if (dashboardMessage) dashboardMessage.textContent = 'Error al actualizar el producto.';
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('admin_logged_in');
    showLogin();
    if (dashboardMessage) dashboardMessage.textContent = '';
  });
}

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const dialog = document.querySelector(`#${button.dataset.closeDialog}`);
    if (dialog) dialog.close();
  });
});