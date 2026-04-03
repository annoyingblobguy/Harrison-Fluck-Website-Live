import { showToast } from './toast.js';

export async function copyToClipboard(text, message = 'Copied!') {
    try {
        await navigator.clipboard.writeText(text);
        showToast(message);
    } catch {
        showToast('Copy failed');
    }
}

export function copyElementText(id, message = 'Copied!') {
    const el = document.getElementById(id);
    if (el) copyToClipboard(el.textContent.trim(), message);
}
