let carrito = JSON.parse(localStorage.getItem('carrito_pet360')) || [];
let categoriaSeleccionada = 'todos';

const productosPorDefecto = [
    { id: 1, nombre: "Alimento Perros 5kg", precio: 18.00, categoria: "Alimento", imagen: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500" },
    { id: 2, nombre: "Juguete Mordedera", precio: 4.50, categoria: "Accesorios", imagen: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500" },
    { id: 3, nombre: "Arena para Gatos 4kg", precio: 7.00, categoria: "Gatos", imagen: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500" }
];

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarBadgeCarrito();
    configurarEventos();
});

function obtenerProductos() {
    const guardados = localStorage.getItem('productos_pet360');
    return guardados ? JSON.parse(guardados) : productosPorDefecto;
}

function cargarProductos() {
    const grid = document.getElementById('productsGrid');
    const busqueda = document.getElementById('searchInput').value.toLowerCase();
    const productos = obtenerProductos();

    grid.innerHTML = '';

    const filtrados = productos.filter(p => {
        const coincideCategoria = categoriaSeleccionada === 'todos' || p.categoria === categoriaSeleccionada;
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda);
        return coincideCategoria && coincideBusqueda;
    });

    if (filtrados.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #777; padding: 2rem;">No se encontraron productos.</p>';
        return;
    }

    filtrados.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${prod.imagen || 'https://via.placeholder.com/300'}" alt="${prod.nombre}" class="product-img">
            <div class="product-info">
                <h3 class="product-title">${prod.nombre}</h3>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Categoría: ${prod.categoria}</p>
                <div class="product-price">$${Number(prod.precio).toFixed(2)}</div>
                <button class="btn-add-cart" onclick="agregarAlCarrito(${prod.id})">Agregar</button>
            </div>
        `;
        grid.appendChild(card);
    });

    actualizarFiltrosCategorias(productos);
}

function actualizarFiltrosCategorias(productos) {
    const contenedor = document.getElementById('categoryFilters');
    const categoriasUnicas = ['todos', ...new Set(productos.map(p => p.categoria))];
    
    contenedor.innerHTML = '';
    categoriasUnicas.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `btn-filter ${categoriaSeleccionada === cat ? 'active' : ''}`;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        btn.onclick = () => {
            categoriaSeleccionada = cat;
            cargarProductos();
        };
        contenedor.appendChild(btn);
    });
}

function agregarAlCarrito(id) {
    const productos = obtenerProductos();
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    guardarCarrito();
    alert(`¡${producto.nombre} agregado al carrito!`);
}

function guardarCarrito() {
    localStorage.setItem('carrito_pet360', JSON.stringify(carrito));
    actualizarBadgeCarrito();
}

function actualizarBadgeCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('cartBadge').textContent = totalItems;
}

function abrirCarrito() {
    const lista = document.getElementById('cartItemsList');
    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #777;">Tu carrito está vacío.</p>';
    } else {
        carrito.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div>
                    <strong>${item.nombre}</strong><br>
                    <small>$${Number(item.precio).toFixed(2)} x ${item.cantidad}</small>
                </div>
                <div style="display:flex; align-items:center; gap: 0.5rem;">
                    <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
                    <button onclick="eliminarDelCarrito(${index})" style="background:none; border:none; color:red; cursor:pointer; font-size: 1.1rem;">X</button>
                </div>
            `;
            lista.appendChild(div);
        });
    }

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('cartTotalText').textContent = `Total: $${total.toFixed(2)}`;
    document.getElementById('cartModal').classList.add('active');
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    abrirCarrito();
}

function enviarPedidoWhatsApp(e) {
    e.preventDefault();
    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    const nombre = document.getElementById('clientName').value.trim();
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
}

function configurarEventos() {
    document.getElementById('searchInput').addEventListener('input', cargarProductos);
    document.getElementById('openCartBtn').addEventListener('click', abrirCarrito);
    document.getElementById('closeCartModal').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('active');
    });
    document.getElementById('checkoutForm').addEventListener('submit', enviarPedidoWhatsApp);
}