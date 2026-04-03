import { TOOL_NAMES, navigateTo } from './router.js';
import { getRecent } from './state.js';

const ALL_TOOLS = Object.entries(TOOL_NAMES)
    .filter(([id]) => id !== 'home')
    .map(([id, name]) => ({ id, name }));

let activeIdx = 0;

export function initCommandPalette() {
    const overlay = document.getElementById('cmd-overlay');
    const input   = document.getElementById('cmd-input');
    const results = document.getElementById('cmd-results');
    if (!overlay || !input || !results) return;

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
        const open = !overlay.classList.contains('hidden');
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openPalette();
            return;
        }
        if (!open) return;
        if (e.key === 'Escape')    { closePalette(); return; }
        if (e.key === 'ArrowDown') { activeIdx = Math.min(activeIdx + 1, results.children.length - 1); highlight(); e.preventDefault(); return; }
        if (e.key === 'ArrowUp')   { activeIdx = Math.max(activeIdx - 1, 0); highlight(); e.preventDefault(); return; }
        if (e.key === 'Enter')     { selectActive(); }
    });

    // Trigger button in header
    document.getElementById('cmd-palette-btn')?.addEventListener('click', openPalette);

    // Close on backdrop click
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closePalette(); });

    // Filter on input
    input.addEventListener('input', () => { activeIdx = 0; render(input.value); });

    function openPalette() {
        overlay.classList.remove('hidden');
        input.value = '';
        render('');
        input.focus();
    }

    function closePalette() {
        overlay.classList.add('hidden');
    }

    function render(q) {
        const trimmed = q.trim().toLowerCase();
        let items;

        if (trimmed) {
            items = ALL_TOOLS.filter(t => t.name.toLowerCase().includes(trimmed));
        } else {
            // Show recents first, then all tools (deduplicated)
            const recent = getRecent()
                .map(id => ALL_TOOLS.find(t => t.id === id))
                .filter(Boolean);
            const seen = new Set(recent.map(t => t.id));
            const rest = ALL_TOOLS.filter(t => !seen.has(t.id));
            items = [...recent, ...rest].slice(0, 12);
        }

        results.innerHTML = items.length
            ? items.map((t, i) => `
                <div class="cmd-item${i === activeIdx ? ' active' : ''}" data-id="${t.id}" data-idx="${i}">
                    <span class="cmd-item-name">${t.name}</span>
                    ${getRecent().includes(t.id) && !trimmed ? '<span class="cmd-item-tag">Recent</span>' : ''}
                </div>`).join('')
            : '<div class="cmd-empty">No tools found</div>';

        results.querySelectorAll('.cmd-item').forEach(el => {
            el.addEventListener('mouseenter', () => {
                activeIdx = parseInt(el.dataset.idx, 10);
                highlight();
            });
            el.addEventListener('click', () => {
                navigateTo(el.dataset.id);
                closePalette();
            });
        });
    }

    function highlight() {
        results.querySelectorAll('.cmd-item').forEach((el, i) =>
            el.classList.toggle('active', i === activeIdx));
        results.querySelector('.cmd-item.active')?.scrollIntoView({ block: 'nearest' });
    }

    function selectActive() {
        const active = results.querySelectorAll('.cmd-item')[activeIdx];
        if (active) { navigateTo(active.dataset.id); closePalette(); }
    }
}
