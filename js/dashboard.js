import { navigateTo, onNavigate, TOOL_NAMES } from './router.js';
import { getFavorites, toggleFavorite, getRecent } from './state.js';
import { initCommandPalette } from './command-palette.js';

import * as network   from './tools/network.js';
import * as developer from './tools/developer.js';
import * as aviation  from './tools/aviation.js';
import * as general   from './tools/general.js';

// ── Auth guard ────────────────────────────────────────────────────────────
if (sessionStorage.getItem('hf_auth') !== '1') {
    location.replace('/login.html');
}

// ── Expose all tool functions on window (preserve onclick= compatibility) ──
Object.assign(window, network, developer, aviation, general);

// Also expose navigateTo for home page onclick= attributes
window.navigateTo = navigateTo;

// ── Logout ────────────────────────────────────────────────────────────────
document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('hf_auth');
    location.replace('/login.html');
});

// ── Sidebar toggle (mobile) ───────────────────────────────────────────────
document.getElementById('sb-toggle')?.addEventListener('click', () => {
    document.getElementById('db-sidebar')?.classList.toggle('open');
});

// ── Sidebar click delegation ──────────────────────────────────────────────
document.querySelectorAll('.sb-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.tool));
});

// ── Sidebar collapsible sections ─────────────────────────────────────────
document.querySelectorAll('.sb-collapsible').forEach(label => {
    label.addEventListener('click', () => {
        const section = label.closest('.sb-section');
        section?.classList.toggle('collapsed');
    });
});

// ── Sidebar search filter ─────────────────────────────────────────────────
document.getElementById('sb-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.sb-group[data-group]').forEach(group => {
        const btns = group.querySelectorAll('.sb-btn[data-tool]');
        let anyVisible = false;
        btns.forEach(btn => {
            const match = !q || btn.textContent.toLowerCase().includes(q);
            btn.style.display = match ? '' : 'none';
            if (match) anyVisible = true;
        });
        const section = group.closest('.sb-section');
        if (section) section.style.display = anyVisible ? '' : 'none';
    });
});

// ── Network Toolkit sub-tab switching ────────────────────────────────────
document.querySelectorAll('.net-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.net-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.net-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('net-' + tab.dataset.net);
        if (panel) panel.classList.add('active');
        // Invalidate Leaflet map when geoip tab is shown
        if (tab.dataset.net === 'geoip') network.invalidateGeoMap();
    });
});

// ── Enter key shortcuts ───────────────────────────────────────────────────
const enterMap = {
    'dns-domain':      () => network.dnsLookup(),
    'ping-host':       () => network.doPing(),
    'port-host':       () => network.checkPort(),
    'port-port':       () => network.checkPort(),
    'whois-query':     () => network.doWhois(),
    'traceroute-host': () => network.doTraceroute(),
    'geoip-query':     () => network.doGeoIP(),
    'ssl-domain':      () => network.checkSSL(),
    'uptime-url':      () => network.checkUptime(),
    'headers-url':     () => network.inspectHeaders(),
    'http-url':        () => developer.sendHttpRequest(),
};
Object.entries(enterMap).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
});

// ── Live listeners for reactive tools ─────────────────────────────────────
document.getElementById('colour-picker-input')?.addEventListener('input', function() {
    developer.updateColour(this.value);
});

['regex-pattern', 'regex-input', 'regex-flags'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => developer.runRegex());
});

document.getElementById('jwt-input')?.addEventListener('input', () => developer.decodeJWT());

// ── Favourite / pin button on tool panels ────────────────────────────────
document.querySelectorAll('.tool-star').forEach(btn => {
    btn.addEventListener('click', () => {
        const toolId = btn.dataset.tool;
        toggleFavorite(toolId);
        updateStarButton(btn, toolId);
        renderSidebarPinned();
        updateHomeIfActive();
    });
});

function updateStarButton(btn, toolId) {
    const favs = getFavorites();
    const pinned = favs.includes(toolId);
    btn.classList.toggle('pinned', pinned);
    btn.title = pinned ? 'Unpin tool' : 'Pin to sidebar';
    btn.querySelector('.star-icon').textContent = pinned ? '★' : '☆';
}

// ── Sidebar: pinned & recent sections ────────────────────────────────────
function renderSidebarPinned() {
    const section = document.getElementById('sb-pinned');
    const group   = document.getElementById('sb-pinned-group');
    if (!section || !group) return;
    const favs = getFavorites();
    if (!favs.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    group.innerHTML = favs.map(id =>
        `<button class="sb-btn" data-tool="${id}">
            <i class="fas fa-star" style="font-size:11px;color:var(--blue)"></i>
            ${TOOL_NAMES[id] || id}
        </button>`
    ).join('');
    group.querySelectorAll('.sb-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.tool));
    });
}

function renderSidebarRecent() {
    const section = document.getElementById('sb-recent-section');
    const group   = document.getElementById('sb-recent-group');
    if (!section || !group) return;
    const recent = getRecent().slice(0, 4);
    if (!recent.length) { section.style.display = 'none'; return; }
    section.style.display = '';
    group.innerHTML = recent.map(id =>
        `<button class="sb-btn" data-tool="${id}">
            <i class="fas fa-history" style="font-size:11px;color:var(--gray-dim)"></i>
            ${TOOL_NAMES[id] || id}
        </button>`
    ).join('');
    group.querySelectorAll('.sb-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.tool));
    });
}

// ── Dashboard Home page ───────────────────────────────────────────────────
function initHome() {
    const h = new Date().getHours();
    const greetingEl = document.getElementById('home-greeting');
    if (greetingEl) greetingEl.textContent =
        h < 12 ? 'Good morning, Harrison.' : h < 17 ? 'Good afternoon, Harrison.' : 'Good evening, Harrison.';

    const dateEl = document.getElementById('home-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Stats
    const recentEl = document.getElementById('stat-recent');
    const pinnedEl = document.getElementById('stat-pinned');
    if (recentEl) recentEl.textContent = getRecent().length;
    if (pinnedEl) pinnedEl.textContent = getFavorites().length;

    // IP widget (lightweight)
    const ipVal = document.getElementById('home-ip-val');
    if (ipVal && ipVal.textContent === 'loading…') {
        fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(d => { if (ipVal) ipVal.textContent = d.ip + ' · ' + (d.city || '') + ', ' + (d.country_code || ''); })
            .catch(() => { if (ipVal) ipVal.textContent = 'Unavailable'; });
    }

    // Render grids
    renderHomeGrid('home-pinned-grid', getFavorites());
    renderHomeGrid('home-recent-grid', getRecent().slice(0, 6));
}

function renderHomeGrid(containerId, toolIds) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!toolIds.length) return; // keep empty state
    container.innerHTML = toolIds.map(id => `
        <button class="quick-tool-card" data-tool="${id}">
            <span class="quick-tool-name">${TOOL_NAMES[id] || id}</span>
        </button>`
    ).join('');
    container.querySelectorAll('.quick-tool-card').forEach(card => {
        card.addEventListener('click', () => navigateTo(card.dataset.tool));
    });
}

function updateHomeIfActive() {
    if (document.getElementById('panel-home')?.classList.contains('active')) {
        initHome();
    }
}

// ── Navigation hooks ──────────────────────────────────────────────────────
onNavigate(toolId => {
    if (toolId === 'home')      initHome();
    if (toolId === 'ip')        general.loadIPInfo();
    if (toolId === 'timestamp') developer.startClock();
    if (toolId === 'colour')    developer.updateColour('#2997ff');
    if (toolId === 'paste')     developer.renderPasteList();

    // Re-render sidebar recent after navigation
    renderSidebarRecent();

    // Update star button states on the newly visible panel
    document.querySelectorAll('.tool-star').forEach(btn => {
        updateStarButton(btn, btn.dataset.tool);
    });
});

// ── Init ──────────────────────────────────────────────────────────────────
developer.httpToggleBody();
developer.updateColour('#2997ff');

renderSidebarPinned();
renderSidebarRecent();

// Initialise star button states
document.querySelectorAll('.tool-star').forEach(btn => {
    updateStarButton(btn, btn.dataset.tool);
});

initCommandPalette();

// Navigate to home on load
navigateTo('home');
