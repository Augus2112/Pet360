// Credenciales de acceso directo
const ADMIN_USER = "pet360admin";
const ADMIN_PASS = "admin123";

// Configuración de JSONBin
const BIN_ID = '6af3e690ffd5d16053b85a92';
const API_KEY = '$2a$10$OnZ5OXF8hEQN4S6BEcNDTO2v3SzWKV1CDFQ1.yjYaYAOYB5kZWhd6';

let productos = [];
let categorias = [];

// Elementos del DOM
const loginCard = document.getElementById('login-card');
const adminPage = document.querySelector('.admin-page');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const formProducto = document.getElementById('formProducto');
const formCategoria = document.getElementById('formCategoria');
const listaProductosAdmin = document.getElementById('listaProductosAdmin');
const listaCategoriasAdmin = document.getElementById('listaCategoriasAdmin');
const selectCategoriaProducto = document.getElementById('categoriaProducto');

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si ya hay una sesión iniciada
    if (localStorage.getItem('pet360_admin_logged') === 'true') {
        mostrarPanelAdmin();
    } else {
        mostrarLogin();
    }

    configurarEventosAdmin();
});

function mostrarLogin() {
    if (loginCard) loginCard.style.display = 'block';
    if (adminPage) adminPage.style.display = 'none';
}

function mostrarPanelAdmin() {
    if (loginCard) loginCard.style.display = 'none';
    if (adminPage) adminPage.style.display = 'block';
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
                if (loginError) loginError.style.display = 'none';
                mostrarPanelAdmin();
            } else {
                if (loginError) {
                    loginError.textContent = 'Usuario o contraseña incorrectos';
                    loginError.style.display = 'block';
                }
            }
        });
    }

    // Formulario para Agregar/Editar Producto
    if (formProducto) {
        formProducto.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarProducto();
        });
    }

    // Formulario para Agregar Categoría
    if (formCategoria) {
        formCategoria.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarCategoria();
        });
    }
}

// Cargar Datos desde JSONBin.io (Método GET usa /latest)
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
        alert("Error al cargar los datos del servidor.");
    }
}

// Guardar Estructura Completa en JSONBin.io (Método PUT SIN /latest)
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
            throw new Error(errData.message || 'Error 403 o de permisos al guardar');
        }

        return true;
    } catch (error) {
        console.error("Error en actualizarJSONBin:", error);
        alert("No se pudieron guardar los cambios en la nube: " + error.message);
        return false;
    }
}

// Función para procesar y guardar un nuevo producto
async function guardarProducto() {
    const id = document.getElementById('productoId')?.value;
    const nombre = document.getElementById('nombreProducto').value.trim();
    const precio = parseFloat(document.getElementById('precioProducto').value);
    const categoria = document.getElementById('categoriaProducto').value;
    const imagen = document.getElementById('imagenProducto').value.trim();
    const descripcion = document.getElementById('descripcionProducto').value.trim();

    if (!nombre || isNaN(precio)) {
        alert("Por favor completa los campos obligatorios.");
        return;
    }

    if (id) {
        // Editar producto existente
        const idx = productos.findIndex(p => p.id == id);
        if (idx !== -1) {
            productos[idx] = { id, nombre, precio, categoria, imagen, descripcion };
        }
    } else {
        // Crear nuevo producto
        const nuevoProd = {
            id: Date.now().toString(),
            nombre,
            precio,
            categoria,
            imagen,
            descripcion
        };
        productos.push(nuevoProd);
    }

    const exito = await actualizarJSONBin();
    if (exito) {
        alert("¡Producto guardado exitosamente en la nube!");
        formProducto.reset();
        if (document.getElementById('productoId')) document.getElementById('productoId').value = '';
        renderizarProductosAdmin();
    }
}

// Función para agregar una nueva categoría
async function guardarCategoria() {
    const nombreCat = document.getElementById('nombreCategoria').value.trim();

    if (!nombreCat) {
        alert("Ingresa un nombre de categoría válido.");
        return;
    }

    // Verificar que no exista previamente
    const existe = categorias.some(c => (typeof c === 'object' ? c.nombre.toLowerCase() : c.toLowerCase()) === nombreCat.toLowerCase());
    if (existe) {
        alert("Esta categoría ya existe.");
        return;
    }

    categorias.push({ id: Date.now().toString(), nombre: nombreCat });

    const exito = await actualizarJSONBin();
    if (exito) {
        alert("¡Categoría agregada exitosamente!");
        formCategoria.reset();
        renderizarCategoriasAdmin();
    }
}

function renderizarCategoriasAdmin() {
    if (!listaCategoriasAdmin) return;
    listaCategoriasAdmin.innerHTML = '';
    if (selectCategoriaProducto) selectCategoriaProducto.innerHTML = '<option value="">Selecciona una categoría</option>';

    categorias.forEach((cat, index) => {
        const nombreCat = typeof cat === 'object' ? cat.nombre : cat;
        const catId = typeof cat === 'object' ? cat.id : index;

        // Renderizar lista en la vista de administración
        const card = document.createElement('div');
        card.className = 'admin-category-card';
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border: 1px solid #e2e8f0; margin-bottom: 0.5rem; border-radius: 8rem;';
        card.innerHTML = `
            <span><strong>${nombreCat}</strong></span>
            <div>
                <button type="button" onclick="eliminarCategoria('${catId}')" style="background:#ef4444; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;">Eliminar</button>
            </div>
        `;
        listaCategoriasAdmin.appendChild(card);

        // Actualizar el selector en el formulario de agregar producto
        if (selectCategoriaProducto) {
            const opt = document.createElement('option');
            opt.value = nombreCat;
            opt.textContent = nombreCat;
            selectCategoriaProducto.appendChild(opt);
        }
    });
}

function renderizarProductosAdmin() {
    if (!listaProductosAdmin) return;
    listaProductosAdmin.innerHTML = '';

    if (productos.length === 0) {
        listaProductosAdmin.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">No hay productos registrados.</p>`;
        return;
    }

    productos.forEach(p => {
        const card = document.createElement('div');
        card.className = 'admin-product-card';
        card.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.8rem; border: 1px solid #e2e8f0; margin-bottom: 0.5rem; border-radius: 6px;';
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${p.imagen || 'https://via.placeholder.com/60'}" width="50" height="50" style="object-fit:cover; border-radius:4px;">
                <div>
                    <strong>${p.nombre}</strong> <small style="color:#64748b;">(${p.categoria || 'Sin categoría'})</small><br>
                    <span style="color:#10b981; font-weight:bold;">$${Number(p.precio).toFixed(2)}</span>
                </div>
            </div>
            <div>
                <button type="button" onclick="prepararEdicionProducto('${p.id}')" style="background:#3b82f6; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer; margin-right:0.4rem;">Editar</button>
                <button type="button" onclick="eliminarProducto('${p.id}')" style="background:#ef4444; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;">Eliminar</button>
            </div>
        `;
        listaProductosAdmin.appendChild(card);
    });
}

window.prepararEdicionProducto = function(id) {
    const prod = productos.find(p => p.id == id);
    if (!prod) return;

    if (document.getElementById('productoId')) document.getElementById('productoId').value = prod.id;
    document.getElementById('nombreProducto').value = prod.nombre;
    document.getElementById('precioProducto').value = prod.precio;
    document.getElementById('categoriaProducto').value = prod.categoria || '';
    document.getElementById('imagenProducto').value = prod.imagen || '';
    document.getElementById('descripcionProducto').value = prod.descripcion || '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.eliminarProducto = async function(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

    productos = productos.filter(p => p.id != id);
    const exito = await actualizarJSONBin();
    if (exito) {
        alert("Producto eliminado.");
        renderizarProductosAdmin();
    }
};

window.eliminarCategoria = async function(catId) {
    if (!confirm("¿Deseas eliminar esta categoría?")) return;

    categorias = categorias.filter((c, index) => {
        const id = typeof c === 'object' ? c.id : index;
        return id != catId;
    });

    const exito = await actualizarJSONBin();
    if (exito) {
        alert("Categoría eliminada.");
        renderizarCategoriasAdmin();
    }
};

// Cerrar sesión
window.cerrarSesionAdmin = function() {
    localStorage.removeItem('pet360_admin_logged');
    mostrarLogin();
};