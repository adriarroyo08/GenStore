import { mainContent } from '../ui.js';

export function renderLogin() {
    mainContent.innerHTML = `
        <div class="fade-in max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 class="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>
            <form id="login-form">
                <div class="mb-4">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="user@example.com" required>
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="password123" required>
                </div>
                <p id="login-error" class="text-red-500 text-sm mb-4 hidden">Email o contraseña incorrectos.</p>
                <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors">Entrar</button>
            </form>
            <p class="text-center text-sm text-gray-600 mt-4">
                ¿No tienes cuenta? <a href="#register" class="text-blue-500 hover:underline">Regístrate</a>
            </p>
        </div>
    `;
}
