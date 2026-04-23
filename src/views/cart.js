import { state } from '../state.js';
import { mainContent } from '../ui.js';

export function renderCart() {
     if (state.cart.length === 0) {
        mainContent.innerHTML = `
            <div class="fade-in text-center bg-white p-8 rounded-xl shadow-lg">
                <h1 class="text-3xl font-bold mb-4">Tu carrito está vacío</h1>
                <p class="text-gray-600 mb-6">Parece que aún no has añadido ningún producto.</p>
                <a href="#products" class="bg-blue-500 text-white text-lg px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-store mr-2"></i>Ver productos
                </a>
            </div>
        `;
        return;
    }

    const cartItemsHTML = state.cart.map(item => {
        const product = state.products.find(p => p.id === item.productId);
        return `
            <div class="flex items-center justify-between p-4 border-b">
                <div class="flex items-center space-x-4">
                    <img src="${product.image}" alt="${product.name}" class="w-20 h-20 object-cover rounded-md">
                    <div>
                        <p class="font-semibold">${product.name}</p>
                        <p class="text-sm text-gray-500">${product.price.toFixed(2)}€</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                     <div class="flex items-center border rounded-md">
                        <button class="update-quantity-btn px-3 py-1 text-lg" data-product-id="${product.id}" data-change="-1">-</button>
                        <span class="px-3 py-1">${item.quantity}</span>
                        <button class="update-quantity-btn px-3 py-1 text-lg" data-product-id="${product.id}" data-change="1">+</button>
                    </div>
                    <p class="font-bold w-24 text-right">${(product.price * item.quantity).toFixed(2)}€</p>
                    <button class="remove-from-cart-btn text-red-500 hover:text-red-700" data-product-id="${product.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }).join('');

    const subtotal = state.cart.reduce((sum, item) => {
        const product = state.products.find(p => p.id === item.productId);
        return sum + (product.price * item.quantity);
    }, 0);

    const shipping = 5.99;
    const total = subtotal + shipping;

    mainContent.innerHTML = `
         <section class="fade-in bg-white p-8 rounded-xl shadow-lg">
            <h1 class="text-3xl font-bold mb-6">Tu Carrito</h1>
            <div class="divide-y">
                ${cartItemsHTML}
            </div>
            <div class="mt-6 flex justify-end">
                <div class="w-full md:w-1/3">
                    <div class="flex justify-between py-2">
                        <span class="text-gray-600">Subtotal:</span>
                        <span>${subtotal.toFixed(2)}€</span>
                    </div>
                    <div class="flex justify-between py-2">
                        <span class="text-gray-600">Envío:</span>
                        <span>${shipping.toFixed(2)}€</span>
                    </div>
                     <div class="flex justify-between py-2 font-bold text-xl border-t mt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}€</span>
                    </div>
                    <button id="checkout-btn" class="w-full mt-4 bg-blue-500 text-white text-lg px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                        Proceder al Pago <i class="fas fa-lock ml-2"></i>
                    </button>
                </div>
            </div>
         </section>
    `;
}
