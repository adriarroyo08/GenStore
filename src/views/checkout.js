import { state } from '../state.js';
import { mainContent } from '../ui.js';
import { handleCheckout } from '../handlers.js';

export function renderCheckout() {
    if (!state.currentUser) {
        location.hash = '#login';
        return;
    }

    const total = state.cart.reduce((sum, item) => {
        const product = state.products.find(p => p.id === item.productId);
        return sum + (product.price * item.quantity);
    }, 0) + 5.99;

    mainContent.innerHTML = `
        <div class="fade-in max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 class="text-2xl font-bold text-center mb-6">Finalizar Compra</h2>
            <p class="text-center text-2xl font-bold mb-6">Total a pagar: ${total.toFixed(2)}€</p>
            <div id="checkout-container"></div>
        </div>
    `;

    // Payment is now handled via Stripe through the React checkout flow
    handleCheckout();
}
