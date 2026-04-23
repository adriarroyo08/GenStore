import { state } from '../state.js';
import { mainContent } from '../ui.js';

export function renderProductsList() {
    let productsHTML = state.products.map(product => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
            <a href="#product/${product.id}" class="block">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
            </a>
            <div class="p-4 flex-grow flex flex-col">
                <h3 class="text-lg font-semibold text-gray-800 mb-1 flex-grow">
                    <a href="#product/${product.id}" class="hover:text-blue-600">${product.name}</a>
                </h3>
                <p class="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full self-start mb-2">${product.category}</p>
                <div class="mt-auto flex items-center justify-between">
                    <span class="text-xl font-bold text-blue-600">${product.price.toFixed(2)}€</span>
                    <button class="add-to-cart-btn bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors" data-product-id="${product.id}">
                        <i class="fas fa-cart-plus mr-2"></i>Añadir
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const aiAssistantHTML = `
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-xl shadow-2xl my-10 text-center">
            <h2 class="text-3xl font-bold mb-2">✨ Asistente de Recuperación IA</h2>
            <p class="mb-4 max-w-2xl mx-auto">¿No sabes qué necesitas? Describe tu dolencia o tu objetivo (ej: "dolor lumbar al estar sentado" o "fortalecer tobillos") y nuestra IA te recomendará los mejores productos.</p>
            <div class="max-w-lg mx-auto">
                <textarea id="ai-prompt-input" class="w-full p-3 rounded-md text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:outline-none" rows="2" placeholder="Describe tu necesidad aquí..."></textarea>
                <button id="get-ai-recommendation-btn" class="mt-3 w-full bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-md hover:bg-yellow-300 transition-transform transform hover:scale-105">
                    Obtener Recomendación
                </button>
            </div>
        </div>
    `;

    mainContent.innerHTML = `
        <section class="fade-in">
            ${aiAssistantHTML}
            <h1 class="text-3xl font-bold mb-6 text-center">Nuestro Catálogo</h1>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                ${productsHTML}
            </div>
        </section>
    `;
}
