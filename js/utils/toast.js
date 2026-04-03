// Toast notification system
let toastEl = null;

export function showToast(msg) {
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'db-toast';
        document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('visible'), 2200);
}
