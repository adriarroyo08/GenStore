import { state } from '../state.js';
import { mainContent } from '../ui.js';

export function renderProductDetail(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        mainContent.innerHTML = `<p class="text-center text-red-500">Producto no encontrado.</p>`;
        return;
    }

    const aiTipsButtonHTML = `
        <div class="mt-6 border-t pt-6">
             <button id="get-ai-tips-btn" data-product-name="${product.name}" data-product-desc="${product.description}" class="w-full bg-indigo-500 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-600 transition-transform transform hover:scale-105 flex items-center justify-center">
                <i class="fas fa-robot mr-2"></i> ✨ Generar consejos de uso con IA
            </button>
        </div>
    `;

    mainContent.innerHTML = `
        <section class="fade-in bg-white p-8 rounded-xl shadow-lg">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div>
                    <img src="${product.image}" alt="${product.name}" class="w-full rounded-lg shadow-md">
                </div>
                <div>
                    <a href="#products" class="text-blue-500 hover:underline mb-4 inline-block"><i class="fas fa-arrow-left mr-2"></i>Volver al catálogo</a>
                    <p class="text-sm text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full self-start inline-block mb-2">${product.category}</p>
                    <h1 class="text-4xl font-bold mb-4">${product.name}</h1>
                    <p class="text-gray-600 text-lg mb-6">${product.description}</p>
                    <div class="flex items-center justify-between bg-gray-100 p-4 rounded-lg">
                        <span class="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}€</span>
                        <button class="add-to-cart-btn bg-emerald-500 text-white text-lg px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors" data-product-id="${product.id}">
                            <i class="fas fa-cart-plus mr-2"></i>Añadir al carrito
                        </button>
                    </div>
                    ${aiTipsButtonHTML}
                </div>
            </div>
        </section>
    `;
}
