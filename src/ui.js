export const app = document.getElementById('app');
export const headerContainer = document.getElementById('header-container');
export const mainContent = document.getElementById('main-content');
export const footerContainer = document.getElementById('footer-container');
export const aiModal = document.getElementById('ai-modal');
export const modalContent = document.getElementById('modal-content');

export function showModalLoading() {
    modalContent.innerHTML = `
        <div class="flex flex-col items-center justify-center p-8">
            <div class="spinner"></div>
            <p class="mt-4 text-gray-600">Consultando a nuestro experto IA...</p>
        </div>`;
    aiModal.classList.remove('hidden');
}

export function showModalContent(htmlContent) {
    modalContent.innerHTML = `<div class="prose max-w-none">${htmlContent}</div>`;
    aiModal.classList.remove('hidden');
}

export function hideModal() {
    aiModal.classList.add('hidden');
}

export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-gray-800';
    toast.className = `fixed bottom-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl transform translate-y-20 opacity-0 transition-all duration-500 z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
