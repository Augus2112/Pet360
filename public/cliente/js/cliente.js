// Configuración de JSONBin
const BIN_ID = '6af3e690ffd5d16053b85a92';
const API_KEY = '$2a$10$OnZ5OXF8hEQN4S6BEcNDTO2v3SzWKV1CDFQ1.yjYaYAOYB5kZWhd6';

let productos = [];
let carrito = [];
let categoriaActual = 'todos';
let listaCategoriasOficiales = ['todos'];
let toastTimeout;

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilters = document.getElementById('categoryFilters');
const cartModal = document.getElementById('cartModal');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartModal = document.getElementById('closeCartModal');
const cartBadge = document.getElementById('cartBadge');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalText = document.getElementById('cartTotalText');
const checkoutForm = document.getElementById('checkoutForm');
const clientNameInput = document.getElementById('clientName');

// Elementos de la Notificación Toast
const toastNotification = document.getElementById('toastNotification');
const toastMessage = document.getElementById('toastMessage');

// Elementos del Modal de Producto
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const modalProductImg = document.getElementById('modalProductImg');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductCategory = document.getElementById('modalProductCategory');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalProductDesc = document.getElementById('modalProductDesc');

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    configurarEventos();
});

async function cargarProductos() {
    try {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">Cargando productos...</p>`;
        
        const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });

        if (!res.ok) throw new Error('Error al obtener datos');

        const data = await res.json();
        
        // Obtenemos los productos y las categorías guardadas en el JSONBin (tanto del admin como de los productos)
        productos = data.record.productos || [];
        const categoriasAdmin = data.record.categorias || [];
        const categoriasDesdeProductos = productos.map(p => p.categoria).filter(Boolean);
        
        // Unimos las listas de categorías sin duplicados para que aparezcan todas en los botones
        listaCategoriasOficiales = ['todos', ...new Set([...categoriasAdmin.map(c => typeof c === 'object' ? c.nombre : c), ...categoriasDesdeProductos])];
        
        renderizarCategorias();
        filtrarYMostrarProductos();
    } catch (e) {
        console.error(e);
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem;">No se pudieron cargar los productos.</p>`;
    }
}

function renderizarCategorias() {
    categoryFilters.innerHTML = '';
    
    listaCategoriasOficiales.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `btn-filter ${cat.toLowerCase() === categoriaActual.toLowerCase() ? 'active' : ''}`;
        btn.textContent = cat === 'todos' ? 'Todos' : (cat.charAt(0).toUpperCase() + cat.slice(1));
        btn.dataset.category = cat;
        btn.addEventListener('click', () => {
            categoriaActual = cat;
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtrarYMostrarProductos();
        });
        categoryFilters.appendChild(btn);
    });
}

function filtrarYMostrarProductos() {
    const textoBusqueda = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    const filtrados = productos.filter(p => {
        const catProducto = p.categoria || 'Sin categoría';
        const coincideCategoria = categoriaActual === 'todos' || catProducto.toLowerCase() === categoriaActual.toLowerCase();
        const coincideTexto = p.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideTexto;
    });

    renderizarProductos(filtrados);
}

function renderizarProductos(lista) {
    productsGrid.innerHTML = '';
    if (lista.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No hay productos disponibles en esta categoría.</p>`;
        return;
    }

    lista.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container" data-id="${producto.id}">
                <img src="${producto.imagen || 'https://via.placeholder.com/240x170'}" alt="${producto.nombre}" class="product-img">
            </div>
            <div class="product-info">
                <h3 class="product-title" data-id="${producto.id}">${producto.nombre}</h3>
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.4rem;">Categoría: ${producto.categoria || 'Sin categoría'}</p>
                <div class="product-price">$${Number(producto.precio).toFixed(2)}</div>
                
                <div class="product-actions-card">
                    <div class="qty-selector">
                        <button type="button" class="btn-qty minus" data-id="${producto.id}">-</button>
                        <input type="number" id="qty-${producto.id}" class="input-qty" value="1" min="1" max="99">
                        <button type="button" class="btn-qty plus" data-id="${producto.id}">+</button>
                    </div>
                    <button class="btn-add-cart" data-id="${producto.id}">Agregar</button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    productsGrid.querySelectorAll('.product-img-container, .product-title').forEach(el => {
        el.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            abrirDetalleProducto(id);
        });
    });

    productsGrid.querySelectorAll('.btn-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.getElementById(`qty-${id}`);
            let val = parseInt(input.value) || 1;
            if (e.target.classList.contains('plus')) {
                val++;
            } else if (e.target.classList.contains('minus') && val > 1) {
                val--;
            }
            input.value = val;
        });
    });

    productsGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const input = document.getElementById(`qty-${id}`);
            const cantidad = parseInt(input.value) || 1;
            agregarAlCarrito(id, cantidad);
        });
    });
}

function abrirDetalleProducto(id) {
    const producto = productos.find(p => p.id == id);
    if (!producto) return;

    modalProductImg.src = producto.imagen || 'https://via.placeholder.com/400x300';
    modalProductImg.alt = producto.nombre;
    modalProductTitle.textContent = producto.nombre;
    modalProductCategory.textContent = `Categoría: ${producto.categoria || 'Sin categoría'}`;
    modalProductPrice.textContent = `$${Number(producto.precio).toFixed(2)}`;
    modalProductDesc.textContent = producto.descripcion || "Este producto no cuenta con una descripción detallada.";

    productModal.classList.add('active');
}

function agregarAlCarrito(id, cantidad) {
    const productoEncontrado = productos.find(p => p.id == id);
    if (!productoEncontrado) return;

    const index = carrito.findIndex(item => item.id == id);
    if (index > -1) {
        carrito[index].cantidad += cantidad;
    } else {
        carrito.push({
            id: productoEncontrado.id,
            nombre: productoEncontrado.nombre,
            precio: Number(productoEncontrado.precio),
            cantidad: cantidad
        });
    }

    actualizarCarritoUI();
    mostrarNotificacion(`${cantidad}x "${productoEncontrado.nombre}" agregado(s)`);

    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = 1;
}

function mostrarNotificacion(mensaje) {
    if (!toastNotification || !toastMessage) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    
    toastMessage.textContent = mensaje;
    toastNotification.classList.add('active');

    toastTimeout = setTimeout(() => {
        toastNotification.classList.remove('active');
    }, 2500);
}

function actualizarCarritoUI() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartBadge) cartBadge.textContent = totalItems;

    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';
    if (carrito.length === 0) {
        cartItemsList.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">Tu carrito está vacío.</p>`;
        if (cartTotalText) cartTotalText.textContent = `Total: $0.00`;
        return;
    }

    carrito.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <strong>${item.nombre}</strong><br>
                <small style="color: #64748b;">$${item.precio.toFixed(2)} x ${item.cantidad}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 0.8rem;">
                <strong>$${(item.precio * item.cantidad).toFixed(2)}</strong>
                <button type="button" onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; font-size:1.2rem;">&times;</button>
            </div>
        `;
        cartItemsList.appendChild(div);
    });

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    if (cartTotalText) cartTotalText.textContent = `Total: $${total.toFixed(2)}`;
}

window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
};

function configurarEventos() {
    if (searchInput) searchInput.addEventListener('input', filtrarYMostrarProductos);

    if (openCartBtn) openCartBtn.addEventListener('click', () => cartModal.classList.add('active'));
    if (closeCartModal) closeCartModal.addEventListener('click', () => cartModal.classList.remove('active'));

    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) cartModal.classList.remove('active');
        });
    }

    if (closeProductModal) closeProductModal.addEventListener('click', () => productModal.classList.add('active') ? null : productModal.classList.remove('active'));

    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) productModal.classList.remove('active');
        });
    }

    if (clientNameInput) {
        clientNameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (carrito.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            const nombre = clientNameInput ? clientNameInput.value.trim() : '';
            const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
            if (!soloLetrasRegex.test(nombre)) {
                alert("Por favor, ingresa un nombre válido que contenga solo letras.");
                return;
            }

            const telefonoTienda = "584244225724";

            let mensaje = `*NUEVO PEDIDO - PET360*\n\n`;
            mensaje += `*Cliente:* ${nombre}\n\n`;
            mensaje += `*Productos:* \n`;

            carrito.forEach(item => {
                mensaje += `- ${item.cantidad}x ${item.nombre} ($${(item.precio * item.cantidad).toFixed(2)})\n`;
            });

            const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            mensaje += `\n*Total a pagar: $${total.toFixed(2)}*`;

            const url = `https://wa.me/${telefonoTienda}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        });
    }
}