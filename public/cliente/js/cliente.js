// URL de tu API de SheetDB (remplaza si tu ID de SheetDB cambia)
const SHEETDB_URL = 'https://sheetdb.io/api/v1/41n1o2132w6nd';

let productos = [];
let categorias = [];
let categoriaActual = 'todas';

// Elementos del DOM
const gridProductos = document.getElementById('gridProductos');
const contenedorCategorias = document.getElementById('contenedorCategorias');

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosDesdeGoogleSheets();
});

// Cargar Datos desde Google Sheets (SheetDB)
async function cargarDatosDesdeGoogleSheets() {
    try {
        // Cargar productos y categorías en paralelo desde sus respectivas pestañas
        const [resProductos, resCategorias] = await Promise.all([
            fetch(`${SHEETDB_URL}?sheet=productos`),
            fetch(`${SHEETDB_URL}?sheet=categorias`)
        ]);

        if (!resProductos.ok || !resCategorias.ok) {
            throw new Error('Error al conectar con la base de datos en Google Sheets');
        }

        productos = await resProductos.json();
        categorias = await resCategorias.json();

        renderizarFiltrosCategorias();
        renderizarProductosCliente();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        if (gridProductos) {
            gridProductos.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Error al cargar el catálogo de productos.</p>`;
        }
    }
}

function renderizarFiltrosCategorias() {
    if (!contenedorCategorias) return;
    contenedorCategorias.innerHTML = '';

    // Botón para 'Todas'
    const btnTodas = document.createElement('button');
    btnTodas.className = `filter-btn ${categoriaActual === 'todas' ? 'active' : ''}`;
    btnTodas.textContent = 'Todas';
    btnTodas.addEventListener('click', () => filtrarPorCategoria('todas', btnTodas));
    contenedorCategorias.appendChild(btnTodas);

    categorias.forEach(cat => {
        const nombreCat = typeof cat === 'object' ? cat.nombre : cat;
        if (!nombreCat) return;

        const btn = document.createElement('button');
        btn.className = `filter-btn ${categoriaActual === nombreCat ? 'active' : ''}`;
        btn.textContent = nombreCat;
        btn.addEventListener('click', () => filtrarPorCategoria(nombreCat, btn));
        contenedorCategorias.appendChild(btn);
    });
}

function filtrarPorCategoria(categoria, botonElemento) {
    categoriaActual = categoria;
    
    // Actualizar clase activa en los botones
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (botonElemento) botonElemento.classList.add('active');

    renderizarProductosCliente();
}

function renderizarProductosCliente() {
    if (!gridProductos) return;
    gridProductos.innerHTML = '';

    const productosFiltrados = categoriaActual === 'todas'
        ? productos
        : productos.filter(p => p.categoria === categoriaActual);

    if (productosFiltrados.length === 0) {
        gridProductos.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">No se encontraron productos en esta categoría.</p>`;
        return;
    }

    productosFiltrados.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${p.imagen || 'https://via.placeholder.com/300x200?text=Pet360'}" alt="${p.nombre}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${p.categoria || 'General'}</span>
                <h3 class="product-title">${p.nombre}</h3>
                <p class="product-description">${p.descripcion || ''}</p>
                <div class="product-footer">
                    <span class="product-price">$${Number(p.precio).toFixed(2)}</span>
                    <button class="whatsapp-btn" onclick="solicitarPorWhatsApp('${p.nombre}', ${p.precio})">
                        Pedir por WhatsApp
                    </button>
                </div>
            </div>
        `;
        gridProductos.appendChild(card);
    });
}

window.solicitarPorWhatsApp = function(nombre, precio) {
    const telefono = "584120000000"; // Reemplazar por tu número real de WhatsApp
    const mensaje = encodeURIComponent(`¡Hola! Me interesa comprar el producto: *${nombre}* por un precio de *$${Number(precio).toFixed(2)}*. ¿Tienen disponibilidad?`);
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
};