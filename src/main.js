import { loadProducts } from './api.js';
import { initializeRouter } from './router.js';
import { app, aiModal, hideModal } from './ui.js';
import {
    addToCart,
    handleLogout,
    updateCartQuantity,
    removeFromCart,
    handleGetRecommendation,
    handleGetUsageTips,
    handleLogin,
    handleRegister,
    handleCheckout
} from './handlers.js';

// --- EVENT LISTENERS ---
app.addEventListener('click', e => {
    // Add to Cart
    if (e.target.matches('.add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
        const button = e.target.closest('.add-to-cart-btn');
        const productId = button.dataset.productId;
        addToCart(productId);
    }

    // Logout
    if (e.target.matches('#logout-btn')) {
        handleLogout();
    }

    // Update Quantity
    if (e.target.matches('.update-quantity-btn')) {
        const productId = e.target.dataset.productId;
        const change = parseInt(e.target.dataset.change);
        updateCartQuantity(productId, change);
    }

    // Remove from cart
    if (e.target.matches('.remove-from-cart-btn') || e.target.closest('.remove-from-cart-btn')) {
        const button = e.target.closest('.remove-from-cart-btn');
        const productId = button.dataset.productId;
        removeFromCart(productId);
    }

    // Checkout
    if (e.target.matches('#checkout-btn')) {
        location.hash = '#checkout';
    }

    // AI Recommendation
    if (e.target.matches('#get-ai-recommendation-btn')) {
        handleGetRecommendation();
    }

    // AI Usage Tips
    if (e.target.matches('#get-ai-tips-btn')) {
        const button = e.target;
        handleGetUsageTips(button.dataset.productName, button.dataset.productDesc);
    }
});

aiModal.addEventListener('click', e => {
    if (e.target.matches('#close-modal-btn') || e.target === aiModal) {
        hideModal();
    }
});

app.addEventListener('submit', e => {
    e.preventDefault();
    // Login form
    if (e.target.matches('#login-form')) {
        const email = e.target.querySelector('#email').value;
        const password = e.target.querySelector('#password').value;
        handleLogin(email, password);
    }
    // Register form
    if (e.target.matches('#register-form')) {
        const name = e.target.querySelector('#name').value;
        const email = e.target.querySelector('#email').value;
        const password = e.target.querySelector('#password').value;
        handleRegister(name, email, password);
    }
    // Checkout form
    if (e.target.matches('#checkout-form')) {
        handleCheckout();
    }
});

// --- INITIALIZATION ---
async function initializeApp() {
    await loadProducts();
    initializeRouter();
}

initializeApp();
