import { firebaseConfig, geminiApiKey } from '../firebase-config.js';
import { state } from './state.js';
import { MOCK_PRODUCTS } from './mock-data.js';
import { showModalLoading, showModalContent } from './ui.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();

export async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        if (snapshot.empty) {
            console.warn("No products found in Firestore, using mock data.");
            state.products = MOCK_PRODUCTS;
        } else {
            state.products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (error) {
        console.error("Error loading products from Firestore:", error);
        console.log("Using mock data as a fallback.");
        state.products = MOCK_PRODUCTS;
    }
}

const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;

export async function callGeminiAPI(prompt) {
    showModalLoading();
    try {
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            // Simple markdown to HTML conversion for lists
            const formattedText = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\* (.*?)(?=\n\* |\n\n|$)/g, '<li class="mb-2">$1</li>') // List items
                .replace(/<\/li><li/g, '</li><ul class="list-disc list-inside mt-2 mb-4"><li')
                .replace(/<li/g, '<ul><li')
                .replace(/<\/li>(?!<ul)/g, '</li></ul>');
            showModalContent(formattedText);
        } else {
            showModalContent('<p class="text-red-500">No se pudo obtener una respuesta de la IA. Inténtalo de nuevo.</p>');
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        showModalContent(`<p class="text-red-500">Hubo un problema al contactar al asistente de IA. Error: ${error.message}</p>`);
    }
}
