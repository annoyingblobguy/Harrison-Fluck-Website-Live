import { addRecent } from './state.js';

export const TOOL_NAMES = {
    home:      'Dashboard',
    net:       'Network Toolkit',
    json:      'JSON Formatter',
    base64:    'Base64',
    colour:    'Colour Picker',
    regex:     'Regex Tester',
    timestamp: 'Timestamp',
    paste:     'Pastebin',
    httpreq:   'HTTP Request Builder',
    jwt:       'JWT Decoder',
    urlenc:    'URL Encoder / Decoder',
    uuid:      'UUID Generator',
    curl:      'cURL → Fetch',
    metar:     'METAR / TAF',
    flights:   'Flight Tracker',
    ip:        'My IP',
    password:  'Password Generator',
};

const _hooks = [];
export const onNavigate = fn => _hooks.push(fn);

export function navigateTo(toolId) {
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + toolId)?.classList.add('active');

    document.querySelectorAll('.sb-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tool === toolId));

    const nameEl = document.getElementById('tool-name');
    if (nameEl) nameEl.textContent = TOOL_NAMES[toolId] || toolId;

    document.getElementById('db-sidebar')?.classList.remove('open');

    if (toolId !== 'home') addRecent(toolId);

    _hooks.forEach(fn => fn(toolId));
}
