// Credenciales de acceso directo
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

// Configuración de JSONBin
const BIN_ID = '6af3e690ffd5d16053b85a92';
const API_KEY = '$2a$10$OnZ5OXF8hEQN4S6BEcNDTO2v3SzWKV1CDFQ1.yjYaYAOYB5kZWhd6';

let productos = [];
let categorias = [];

// Elementos del DOM basados en tu admin.html
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
    // Verificar si ya hay una sesión iniciada
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
    cargarDatosJSONBin();
}

function configurarEventosAdmin() {
    // Formulario de Inicio de Sesión
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

    // Botón de Cerrar Sesión
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('pet360_admin_logged');
            mostrarLogin();
        });
    }

    // Formulario para Agregar Categoría
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCategoria();
        });
    }

    // Formulario para Agregar Producto
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarProducto();
        });
    }
}

// Cargar Datos desde JSONBin.io (GET)
async function cargarDatosJSONBin() {
    try {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });

        if (!res.ok) throw new Error('Error al obtener datos');

        const data = await res.json();
        productos = data.record.productos || [];
        categorias = data.record.categorias || [];

        renderizarCategoriasAdmin();
        renderizarProductosAdmin();
    } catch (error) {
        console.error("Error al cargar datos desde JSONBin:", error);
    }
}

// Guardar Estructura Completa en JSONBin.io (PUT SIN /latest para evitar error 403)
async function actualizarJSONBin() {
    try {
        const payload = {
            productos: productos,
            categorias: categorias
        };

        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Error de permisos al guardar');
        }

        return true;
    } catch (error) {
        console.error("Error en actualizarJSONBin:", error);
        alert("No se pudieron guardar los cambios en la nube: " + error.message);
        return false;
    }
}

// Guardar Categoría
async function guardarCategoria() {
    const nombreInput = document.getElementById('category-name');
    const nombreCat = nombreInput.value.trim();

    if (!nombreCat) return;

    const existe = categorias.some(c => (typeof c === 'object' ? c.nombre.toLowerCase() : c.toLowerCase()) === nombreCat.toLowerCase());
    if (existe) {
        alert("Esta categoría ya existe.");
        return;
    }

    categorias.push({ id: Date.now().toString(), nombre: nombreCat });

    const exito = await actualizarJSONBin();
    if (exito) {
        nombreInput.value = '';
        renderizarCategoriasAdmin();
    }
}

// Guardar Producto
async function guardarProducto() {
    const nombre = document.getElementById('product-name').value.trim();
    const descripcion = document.getElementById('product-description').value.trim();
    const precio = parseFloat(document.getElementById('product-price').value);
    const categoria = productCategorySelect.value;
    const imageInput = document.getElementById('product-image');

    if (!nombre || isNaN(precio) || !categoria) {
        alert("Por favor completa los campos obligatorios.");
        return;
    }

    // Convertir imagen seleccionada a Base64 para guardarla de forma segura en JSONBin
    let imagenUrl = 'https://via.placeholder.com/240x170';
    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(uploadEvent) {
            imagenUrl = uploadEvent.target.result;
            await registrarYGuardarProducto(nombre, descripcion, precio, categoria, imagenUrl);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        await registrarYGuardarProducto(nombre, descripcion, precio, categoria, imagenUrl);
    }
}

async function registrarYGuardarProducto(nombre, descripcion, precio, categoria, imagen) {
    const nuevoProd = {
        id: Date.now().toString(),
        nombre,
        descripcion,
        precio,
        categoria,
        imagen
    };

    productos.push(nuevoProd);

    const exito = await actualizarJSONBin();
    if (exito) {
        productForm.reset();
        renderizarProductosAdmin();
        alert("¡Producto guardado exitosamente!");
    }
}

// Renderizar Categorías en el Panel
function renderizarCategoriasAdmin() {
    if (!categoryList) return;
    categoryList.innerHTML = '';
    if (productCategorySelect) productCategorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

    categorias.forEach((cat, index) => {
        const nombreCat = typeof cat === 'object' ? cat.nombre : cat;
        const catId = typeof cat === 'object' ? cat.id : index;

        // Lista visual en el panel
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #edf2f7;';
        li.innerHTML = `
            <span><strong>${nombreCat}</strong></span>
            <button type="button" onclick="eliminarCategoria('${catId}')" style="background:#ef4444; color:white; border:none; padding:0.3rem 0.6rem; border-radius:4px; cursor:pointer; font-size:0.85rem;">Eliminar</button>
        `;
        categoryList.appendChild(li);

        // Llenar el select del formulario de productos
        if (productCategorySelect) {
            const opt = document.createElement('option');
            opt.value = nombreCat;
            opt.textContent = nombreCat;
            productCategorySelect.appendChild(opt);
        }
    });
}

// Renderizar Productos en el Panel
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

// Funciones globales para eliminar
window.eliminarProducto = async function(id) {
    if (!confirm("¿Deseas eliminar este producto?")) return;
    productos = productos.filter(p => p.id != id);
    const exito = await actualizarJSONBin();
    if (exito) renderizarProductosAdmin();
};

window.eliminarCategoria = async function(catId) {
    if (!confirm("¿Deseas eliminar esta categoría?")) return;
    categorias = categorias.filter((c, index) => {
        const id = typeof c === 'object' ? c.id : index;
        return id != catId;
    });
    const exito = await actualizarJSONBin();
    if (exito) renderizarCategoriasAdmin();
};