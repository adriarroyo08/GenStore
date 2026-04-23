import { state } from './state.js';
import { showToast } from './ui.js';
import { callGeminiAPI } from './api.js';
import { render } from './router.js';

export function addToCart(productId) {
    const existingItem = state.cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({ productId: productId, quantity: 1 });
    }
    showToast('Producto añadido al carrito');
    render();
}

export function updateCartQuantity(productId, change) {
    const item = state.cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            render();
        }
    }
}

export function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.productId !== productId);
    render();
}

export function handleLogin(email, password) {
    const user = state.users.find(u => u.email === email && u.password === password);
    const errorEl = document.getElementById('login-error');
    if (user) {
        state.currentUser = { name: user.name, email: user.email };
        location.hash = '#products';
    } else {
        if (errorEl) errorEl.classList.remove('hidden');
    }
}

export function handleRegister(name, email, password) {
    const errorEl = document.getElementById('register-error');
    if(state.users.find(u => u.email === email)) {
        if (errorEl) {
            errorEl.textContent = 'Este email ya está registrado.';
            errorEl.classList.remove('hidden');
        }
        return;
    }
    const newUser = { name, email, password };
    state.users.push(newUser);
    state.currentUser = { name: newUser.name, email: newUser.email };
    location.hash = '#products';
}

export function handleLogout() {
    state.currentUser = null;
    location.hash = '#products';
}

export function handleCheckout() {
    if (state.cart.length === 0) return;

    // The order is already created in Firestore, so we just clear the cart and redirect.
    const orderId = Date.now().toString().slice(-6); // Keep a temporary ID for the toast message
    state.cart = [];

    showToast(`¡Pedido #${orderId} realizado con éxito!`, 'success');
    location.hash = '#orders';
}

export function handleGetRecommendation() {
    const input = document.getElementById('ai-prompt-input');
    const userPrompt = input.value.trim();
    if (!userPrompt) {
        showToast('Por favor, describe tu necesidad.', 'error');
        return;
    }

    const productList = state.products.map(p => `- ${p.name}: ${p.description}`).join('\n');
    const fullPrompt = `Eres un asistente de productos experto y amigable para una tienda online llamada GenStore. Un cliente tiene la siguiente necesidad: "${userPrompt}". Basándote en la siguiente lista de productos disponibles, recomienda 2 o 3 productos que sean los más adecuados para él. Explica brevemente y de forma sencilla por qué cada producto es útil para su caso. Formatea tu respuesta claramente, usando negritas para los nombres de los productos. No inventes productos que no estén en la lista.

    Productos Disponibles:
    ${productList}`;

    callGeminiAPI(fullPrompt);
}

export function handleGetUsageTips(productName, productDesc) {
     const fullPrompt = `Eres un asistente de productos. Para el producto llamado "${productName}", que se describe como "${productDesc}", proporciona 3 o 4 consejos prácticos, seguros y fáciles de seguir para un principiante sobre cómo usarlo de manera efectiva para la uso diario. Usa un lenguaje claro y alentador. Formatea los consejos como una lista.`;
     callGeminiAPI(fullPrompt);
}
