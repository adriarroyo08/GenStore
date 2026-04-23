import { state } from '../state.js';
import { mainContent } from '../ui.js';

export function renderOrders() {
    if (!state.currentUser) {
        location.hash = '#login';
        return;
    }
    if (state.orders.length === 0) {
         mainContent.innerHTML = `
            <div class="fade-in text-center bg-white p-8 rounded-xl shadow-lg">
                <h1 class="text-3xl font-bold mb-4">No tienes pedidos</h1>
                <p class="text-gray-600 mb-6">Todos tus pedidos aparecerán aquí.</p>
                <a href="#products" class="bg-blue-500 text-white text-lg px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-store mr-2"></i>Empezar a comprar
                </a>
            </div>
        `;
        return;
    }

    const ordersHTML = state.orders.map(order => `
        <div class="bg-gray-50 p-4 rounded-lg border">
            <div class="flex justify-between items-center mb-4 pb-2 border-b">
                <div>
                    <p class="font-bold">Pedido #${order.id}</p>
                    <p class="text-sm text-gray-500">Fecha: ${order.date}</p>
                </div>
                <p class="font-bold text-lg text-blue-600">Total: ${order.total.toFixed(2)}€</p>
            </div>
            <div>
                ${order.items.map(item => {
                    const product = state.products.find(p => p.id === item.productId);
                    return `
                        <div class="flex items-center space-x-3 text-sm mb-2">
                            <img src="${product.image}" class="w-12 h-12 rounded-md object-cover">
                            <span>${item.quantity} x ${product.name}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');

    mainContent.innerHTML = `
        <section class="fade-in bg-white p-8 rounded-xl shadow-lg">
            <h1 class="text-3xl font-bold mb-6">Mis Pedidos</h1>
            <div class="space-y-6">
                ${ordersHTML}
            </div>
        </section>
    `;
}
