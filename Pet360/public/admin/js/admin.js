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

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || 'No se pudo completar la solicitud.');
  }

  return result;
}

function getRequestErrorMessage(error, fallback) {
  if (location.protocol === 'file:') {
    return 'Abre el panel desde http://localhost:3000/admin/ y ejecuta "npm start" dentro de la carpeta Pet360.';
  }

  if (error instanceof TypeError) {
    return 'No se pudo conectar con el servidor. Ejecuta "npm start" dentro de la carpeta Pet360 y vuelve a abrir http://localhost:3000/admin/.';
  }

  return error.message || fallback;
}

async function loadCatalog() {
  const response = await fetch('/api/catalogo');
  currentCatalog = await readResponse(response);
  renderCategories(currentCatalog.categorias);
  renderProducts(currentCatalog.productos, currentCatalog.categorias);
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
    option.value = String(category.id);
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
    image.src = product.imagen;
    image.alt = product.nombre;
    image.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'product-info';

    const name = document.createElement('h3');
    name.textContent = product.nombre;

    const category = categories.find((entry) => entry.id === product.categoriaId);
    const categoryName = document.createElement('p');
    categoryName.textContent = category ? category.nombre : 'Sin categoría';

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

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  loginButton.disabled = true;

  const formData = new FormData(loginForm);

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password'),
      }),
    });

    await readResponse(response);
    loginForm.reset();
    showDashboard();
    dashboardMessage.textContent = 'Sesión iniciada. Cargando catálogo...';
    await loadCatalog();
    dashboardMessage.textContent = 'Sesión iniciada. Puedes administrar tu catálogo.';
  } catch (error) {
    if (dashboard.hidden) {
      formMessage.textContent = getRequestErrorMessage(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } else {
      dashboardMessage.textContent = getRequestErrorMessage(error, 'No se pudo cargar el catálogo.');
    }
  } finally {
    loginButton.disabled = false;
  }
});

categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = categoryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  dashboardMessage.textContent = '';

  try {
    const response = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: categoryInput.value }),
    });
    const category = await readResponse(response);
    categoryForm.reset();
    await loadCatalog();
    dashboardMessage.textContent = `Categoría "${category.nombre}" agregada.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo agregar la categoría.';
  } finally {
    submitButton.disabled = false;
  }
});

categoryList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const category = currentCatalog.categorias.find((item) => item.id === Number(button.dataset.id));
  if (!category) {
    return;
  }

  if (button.dataset.action === 'edit-category') {
    editCategoryId.value = String(category.id);
    editCategoryName.value = category.nombre;
    editCategoryDialog.showModal();
    editCategoryName.focus();
    return;
  }

  if (!window.confirm(`¿Eliminar la categoría "${category.nombre}"?`)) {
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch(`/api/categorias/${category.id}`, { method: 'DELETE' });
    await readResponse(response);
    await loadCatalog();
    dashboardMessage.textContent = `Categoría "${category.nombre}" eliminada.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo eliminar la categoría.';
  } finally {
    button.disabled = false;
  }
});

editCategoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = editCategoryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/categorias/${editCategoryId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editCategoryName.value }),
    });
    const category = await readResponse(response);
    editCategoryDialog.close();
    await loadCatalog();
    dashboardMessage.textContent = `Categoría "${category.nombre}" actualizada.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo actualizar la categoría.';
  } finally {
    submitButton.disabled = false;
  }
});

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = productForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  dashboardMessage.textContent = '';

  try {
    const response = await fetch('/api/productos', {
      method: 'POST',
      body: new FormData(productForm),
    });
    const product = await readResponse(response);
    productForm.reset();
    await loadCatalog();
    dashboardMessage.textContent = `Producto "${product.nombre}" agregado.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo agregar el producto.';
  } finally {
    submitButton.disabled = false;
  }
});

productList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const product = currentCatalog.productos.find((item) => item.id === Number(button.dataset.id));
  if (!product) {
    return;
  }

  if (button.dataset.action === 'edit-product') {
    document.querySelector('#edit-product-id').value = String(product.id);
    document.querySelector('#edit-product-name').value = product.nombre;
    document.querySelector('#edit-product-description').value = product.descripcion;
    document.querySelector('#edit-product-price').value = String(product.precio);
    editProductCategory.value = String(product.categoriaId);
    document.querySelector('#edit-product-image').value = '';
    editProductDialog.showModal();
    document.querySelector('#edit-product-name').focus();
    return;
  }

  if (!window.confirm(`¿Eliminar el producto "${product.nombre}"?`)) {
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch(`/api/productos/${product.id}`, { method: 'DELETE' });
    const result = await readResponse(response);
    await loadCatalog();
    dashboardMessage.textContent = result.warning || `Producto "${product.nombre}" eliminado.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo eliminar el producto.';
  } finally {
    button.disabled = false;
  }
});

editProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const productId = document.querySelector('#edit-product-id').value;
  const submitButton = editProductForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/productos/${productId}`, {
      method: 'PUT',
      body: new FormData(editProductForm),
    });
    const product = await readResponse(response);
    editProductDialog.close();
    await loadCatalog();
    dashboardMessage.textContent = product.warning || `Producto "${product.nombre}" actualizado.`;
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo actualizar el producto.';
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(`#${button.dataset.closeDialog}`).close();
  });
});

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true;

  try {
    const response = await fetch('/api/admin/logout', { method: 'POST' });

    if (!response.ok) {
      throw new Error('No se pudo cerrar sesión. Inténtalo de nuevo.');
    }

    showLogin();
    dashboardMessage.textContent = '';
  } catch (error) {
    dashboardMessage.textContent = error.message || 'No se pudo conectar con el servidor.';
  } finally {
    logoutButton.disabled = false;
  }
});

fetch('/api/admin/session')
  .then(readResponse)
  .then(async (result) => {
    if (result.authenticated) {
      showDashboard();
      dashboardMessage.textContent = 'Cargando catálogo...';
      await loadCatalog();
      dashboardMessage.textContent = 'Puedes administrar tu catálogo.';
    }
  })
  .catch((error) => {
    formMessage.textContent = error.message || 'No se pudo verificar la sesión con el servidor.';
  });
