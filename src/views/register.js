import { mainContent } from '../ui.js';

export function renderRegister() {
    mainContent.innerHTML = `
        <div class="fade-in max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h2 class="text-2xl font-bold text-center mb-6">Crear Cuenta</h2>
            <form id="register-form">
                 <div class="mb-4">
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <input type="text" id="name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div class="mb-4">
                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <div class="mb-6">
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input type="password" id="password" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                </div>
                <p id="register-error" class="text-red-500 text-sm mb-4 hidden"></p>
                <button type="submit" class="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition-colors">Registrarse</button>
            </form>
             <p class="text-center text-sm text-gray-600 mt-4">
                ¿Ya tienes cuenta? <a href="#login" class="text-blue-500 hover:underline">Inicia Sesión</a>
            </p>
        </div>
    `;
}
