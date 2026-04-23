export const state = {
    products: [], // Will be loaded from Firebase
    cart: [], // { productId, quantity }
    currentUser: null, // or { name: 'Usuario' }
    orders: [], // { id, date, items, total }
    currentPage: 'products',
    selectedProductId: null,
    // Simple user storage for demo purposes
    users: [{ email: 'user@example.com', password: 'password123', name: 'Juan Pérez' }],
};
