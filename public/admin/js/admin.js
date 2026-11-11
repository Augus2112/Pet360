// Credenciales de administración local
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

// URL de la API de SheetDB
const SHEETDB_URL = 'https://sheetdb.io/api/v1/xqcm1sjvwwpno';

let productos = [];
let categorias = [];

// Selectores sincronizados con tu admin.html
const loginCard = document.getElementById('login-card');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const formMessage = document.getElementById('form-message');
const logoutButton = document.getElementById('logout-button');

const categoryForm = document.getElementById('category-form');
const categoryList = document.getElementById('category-list');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const emptyProducts = document.getElementById('empty-products');
const productCategorySelect = document.getElementById('product-category');

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('pet360_admin_logged') === 'true') {
        mostrarDashboard();
    } else {
        mostrarLogin();
    }

    configurarEventosAdmin();
});

function mostrarLogin() {
    if (loginCard) loginCard.removeAttribute('hidden');
    if (dashboard) dashboard.setAttribute('hidden', 'true');
}

function mostrarDashboard() {
    if (loginCard) loginCard.setAttribute('hidden', 'true');
    if (dashboard) dashboard.removeAttribute('hidden');
    cargarDatosDesdeGoogleSheets();
}

function configurarEventosAdmin() {
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value.trim();
            const pass = document.getElementById('password').value.trim();

            if (user === ADMIN_USER && pass === ADMIN_PASS) {
                localStorage.setItem('pet360_admin_logged', 'true');
                if (formMessage) formMessage.textContent = '';
                mostrarDashboard();
            } else {
                if (formMessage) {
                    formMessage.textContent = 'Usuario o contraseña incorrectos.';
                    formMessage.style.color = '#ef4444';
                }
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('pet360_admin_logged');
            mostrarLogin();
        });
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCategoria();
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarProducto();
        });
    }
}

// Cargar datos desde Google Sheets
async function cargarDatosDesdeGoogleSheets() {
    try {
        const [resProductos, resCategorias] = await Promise.all([
            fetch(`${SHEETDB_URL}?sheet=productos`),
            fetch(`${SHEETDB_URL}?sheet=categorias`)
        ]);

        if (!resProductos.ok || !resCategorias.ok) {
            throw new Error('Error al conectar con Google Sheets');
        }

        productos = await resProductos.json();
        categorias = await resCategorias.json();

        renderizarCategoriasAdmin();
        renderizarProductosAdmin();
    } catch (error) {
        console.error("Error al cargar datos desde SheetDB:", error);
    }
}

// Agregar Categoría (POST a la pestaña 'categorias')
async function guardarCategoria() {
    const nombreInput = document.getElementById('category-name');
    const nombreCat = nombreInput.value.trim();

    if (!nombreCat) return;

    const existe = categorias.some(c => c.nombre.toLowerCase() === nombreCat.toLowerCase());
    if (existe) {
        alert("Esta categoría ya existe.");
        return;
    }

    const nuevaCat = { id: Date.now().toString(), nombre: nombreCat };

    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [nuevaCat] })
        });

        if (!res.ok) throw new Error('Error al guardar categoría');

        categorias.push(nuevaCat);
        nombreInput.value = '';
        renderizarCategoriasAdmin();
        alert("¡Categoría guardada en Google Sheets!");
    } catch (error) {
        console.error("Error al guardar categoría:", error);
        alert("No se pudo guardar la categoría: " + error.message);
    }
}

// Agregar Producto (POST a la pestaña 'productos')
async function guardarProducto() {
    const nombre = document.getElementById('product-name').value.trim();
    const descripcion = document.getElementById('product-description').value.trim();
    const precio = parseFloat(document.getElementById('product-price').value);
    const categoria = productCategorySelect.value;
    const imagenUrl = document.getElementById('product-image').value.trim();

    if (!nombre || isNaN(precio) || !categoria || !imagenUrl) {
        alert("Por favor completa los campos obligatorios.");
        return;
    }

    const nuevoProd = {
        id: Date.now().toString(),
        nombre,
        descripcion,
        precio,
        categoria,
        imagen: imagenUrl
    };

    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [nuevoProd] })
        });

        if (!res.ok) throw new Error('Error al guardar el producto');

        productos.push(nuevoProd);
        productForm.reset();
        renderizarProductosAdmin();
        alert("¡Producto guardado exitosamente en Google Sheets!");
    } catch (error) {
        console.error("Error al guardar producto:", error);
        alert("No se pudo guardar el producto: " + error.message);
    }
}

function renderizarCategoriasAdmin() {
    if (!categoryList) return;
    categoryList.innerHTML = '';
    if (productCategorySelect) productCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

    categorias.forEach(cat => {
        const nombreCat = typeof cat === 'object' ? cat.nombre : cat;
        const catId = typeof cat === 'object' ? cat.id : cat;

        const li = document.createElement('li');
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #edf2f7;';
        li.innerHTML = `
            <span><strong>${nombreCat}</strong></span>
            <button type="button" onclick="eliminarCategoria('${catId}')" style="background:#ef4444; color:white; border:none; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer; font-size:0.85rem;">Eliminar</button>
        `;
        categoryList.appendChild(li);

        if (productCategorySelect) {
            const opt = document.createElement('option');
            opt.value = nombreCat;
            opt.textContent = nombreCat;
            productCategorySelect.appendChild(opt);
        }
    });
}

function renderizarProductosAdmin() {
    if (!productList) return;
    productList.innerHTML = '';

    if (productos.length === 0) {
        if (emptyProducts) emptyProducts.style.display = 'block';
        return;
    }

    if (emptyProducts) emptyProducts.style.display = 'none';

    productos.forEach(p => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #edf2f7;';
        li.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${p.imagen || 'https://via.placeholder.com/60'}" width="50" height="50" style="object-fit:cover; border-radius:6px;">
                <div>
                    <strong>${p.nombre}</strong> <small style="color:#64748b;">(${p.categoria})</small><br>
                    <span style="color:#10b981; font-weight:bold;">$${Number(p.precio).toFixed(2)}</span>
                </div>
            </div>
            <button type="button" onclick="eliminarProducto('${p.id}')" style="background:#ef4444; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; font-size:0.85rem;">Eliminar</button>
        `;
        productList.appendChild(li);
    });
}

// Eliminar Producto (DELETE por ID en SheetDB)
window.eliminarProducto = async function(id) {
    if (!confirm("¿Deseas eliminar este producto de Google Sheets?")) return;

    try {
        const res = await fetch(`${SHEETDB_URL}/id/${id}?sheet=productos`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Error al eliminar en Google Sheets');

        productos = productos.filter(p => p.id != id);
        renderizarProductosAdmin();
        alert("Producto eliminado.");
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert("No se pudo eliminar el producto: " + error.message);
    }
};

// Eliminar Categoría (DELETE por ID en SheetDB)
window.eliminarCategoria = async function(catId) {
    if (!confirm("¿Deseas eliminar esta categoría de Google Sheets?")) return;

    try {
        const res = await fetch(`${SHEETDB_URL}/id/${catId}?sheet=categorias`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Error al eliminar categoría');

        categorias = categorias.filter(c => c.id != catId);
        renderizarCategoriasAdmin();
        alert("Categoría eliminada.");
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        alert("No se pudo eliminar la categoría: " + error.message);
    }
};