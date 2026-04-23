import { state } from './state.js';
import { headerContainer, footerContainer } from './ui.js';

export function renderHeader() {
    const cartItemCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const userSection = state.currentUser
        ? `
            <div class="flex items-center space-x-4">
                <a href="#orders" class="hover:text-blue-500 transition-colors">Mis Pedidos</a>
                <span class="text-gray-600">Hola, ${state.currentUser.name}</span>
                <button id="logout-btn" class="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors text-sm">Salir</button>
            </div>
        `
        : `
            <a href="#login" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">Iniciar Sesión</a>
        `;

    headerContainer.innerHTML = `
        <nav class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <div class="flex-shrink-0">
                        <a href="#products" class="text-2xl font-bold text-blue-600 flex items-center">
                            <i class="fas fa-heart-pulse mr-2"></i>GenStore
                        </a>
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="#products" class="text-gray-600 hover:text-blue-500 transition-colors font-medium">Productos</a>
                        <a href="#cart" class="relative text-gray-600 hover:text-blue-500 transition-colors">
                            <i class="fas fa-shopping-cart text-xl"></i>
                            ${cartItemCount > 0 ? `<span class="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">${cartItemCount}</span>` : ''}
                        </a>
                        ${userSection}
                    </div>
                </div>
            </div>
        </nav>
    `;
}

export function renderFooter() {
    footerContainer.innerHTML = `
        <div class="bg-gray-800 text-white mt-auto">
            <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
                <p>&copy; ${new Date().getFullYear()} GenStore. Todos los derechos reservados.</p>
                <p class="text-gray-400 text-sm mt-1">Tu tienda de confianza para la recuperación y el bienestar.</p>
            </div>
        </div>
    `;
}
