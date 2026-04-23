import { state } from './state.js';
import { renderProductsList } from './views/products.js';
import { renderProductDetail } from './views/productDetail.js';
import { renderCart } from './views/cart.js';
import { renderCheckout } from './views/checkout.js';
import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderOrders } from './views/orders.js';
import { renderHeader, renderFooter } from './ui-components.js';

function router() {
    const path = location.hash.split('/');
    const page = path[0] || '#products';

    switch (page) {
        case '#product':
            const productId = path[1]; // Treat ID as a string
            state.currentPage = 'productDetail';
            state.selectedProductId = productId;
            break;
        case '#cart':
            state.currentPage = 'cart';
            break;
        case '#login':
            state.currentPage = 'login';
            break;
        case '#register':
            state.currentPage = 'register';
            break;
        case '#orders':
            state.currentPage = 'orders';
            break;
        case '#checkout':
            state.currentPage = 'checkout';
            break;
        default:
            state.currentPage = 'products';
            break;
    }
    render();
}

export function render() {
    renderHeader();
    renderFooter();

    switch (state.currentPage) {
        case 'products':
            renderProductsList();
            break;
        case 'productDetail':
            renderProductDetail(state.selectedProductId);
            break;
        case 'cart':
            renderCart();
            break;
        case 'login':
            renderLogin();
            break;
        case 'register':
            renderRegister();
            break;
        case 'orders':
            renderOrders();
            break;
        case 'checkout':
            renderCheckout();
            break;
    }
}

export function initializeRouter() {
    window.addEventListener('hashchange', router);
    window.addEventListener('load', router);
    router();
}
