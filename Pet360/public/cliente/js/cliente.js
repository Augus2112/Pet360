// Llave de localStorage compartida con el Admin
const STORAGE_KEY = 'productos_pet360';

let productos = [];
let carrito = [];
let categoriaActual = 'todos';

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

// Elementos del Modal de Producto
const productModal = document.getElementById('productModal');
const closeProductModal = document.getElementById('closeProductModal');
const modalProductImg = document.getElementById('modalProductImg');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductCategory = document.getElementById('modalProductCategory');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalProductDesc = document.getElementById('modalProductDesc');

// Inicializar la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    configurarEventos();
});

function cargarProductos() {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (datos) {
        try {
            productos = JSON.parse(datos);
        } catch (e) {
            productos = [];
        }
    } else {
        productos = [
            { id: 1, nombre: 'Alimento Perros 5kg', precio: 18.00, categoria: 'Alimento', descripcion: 'Alimento premium formulado para perros adultos de todas las razas, rico en nutrientes y proteínas esenciales.', imagen: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500' },
            { id: 2, nombre: 'Juguete Mordedera', precio: 4.50, categoria: 'Accesorios', descripcion: 'Juguete resistente de goma ideal para la limpieza dental y entretenimiento diario de tu mascota.', imagen: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=500' },
            { id: 3, nombre: 'Arena para Gatos 4kg', precio: 7.00, categoria: 'Gatos', descripcion: 'Arena aglutinante de alta absorción que neutraliza los malos olores de manera eficaz.', imagen: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500' }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    }
    renderizarCategorias();
    filtrarYMostrarProductos();
}

function renderizarCategorias() {
    const categorias = ['todos', ...new Set(productos.map(p => p.categoria))];
    categoryFilters.innerHTML = '';
    
    categorias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `btn-filter ${cat === categoriaActual ? 'active' : ''}`;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
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
    const textoBusqueda = searchInput.value.toLowerCase().trim();
    
    const filtrados = productos.filter(p => {
        const coincideCategoria = categoriaActual === 'todos' || p.categoria.toLowerCase() === categoriaActual.toLowerCase();
        const coincideTexto = p.nombre.toLowerCase().includes(textoBusqueda);
        return coincideCategoria && coincideTexto;
    });

    renderizarProductos(filtrados);
}

function renderizarProductos(lista) {
    productsGrid.innerHTML = '';
    if (lista.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No se encontraron productos.</p>`;
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
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 0.4rem;">Categoría: ${producto.categoria}</p>
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
    modalProductCategory.textContent = `Categoría: ${producto.categoria}`;
    modalProductPrice.textContent = `$${Number(producto.precio).toFixed(2)}`;
    modalProductDesc.textContent = producto.descripcion || "Este producto no cuenta con una descripción detallada por el momento.";

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
    
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = 1;
}

function actualizarCarritoUI() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartBadge.textContent = totalItems;

    cartItemsList.innerHTML = '';
    if (carrito.length === 0) {
        cartItemsList.innerHTML = `<p style="text-align: center; color: #64748b; padding: 1rem;">Tu carrito está vacío.</p>`;
        cartTotalText.textContent = `Total: $0.00`;
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
    cartTotalText.textContent = `Total: $${total.toFixed(2)}`;
}

window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
};

function configurarEventos() {
    searchInput.addEventListener('input', filtrarYMostrarProductos);

    openCartBtn.addEventListener('click', () => {
        cartModal.classList.add('active');
    });

    closeCartModal.addEventListener('click', () => {
        cartModal.classList.remove('active');
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
        }
    });

    closeProductModal.addEventListener('click', () => {
        productModal.classList.remove('active');
    });

    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.remove('active');
        }
    });

    // Validación en tiempo real: Evitar que se escriban números en el campo de nombre
    if (clientNameInput) {
        clientNameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[0-9]/g, '');
        });
    }

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        const nombre = clientNameInput.value.trim();
        
        // Comprobación adicional al enviar el formulario
        const soloLetrasRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
        if (!soloLetrasRegex.test(nombre)) {
            alert("Por favor, ingresa un nombre válido que contenga solo letras.");
            return;
        }

        const telefonoTienda = "584120000000";

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