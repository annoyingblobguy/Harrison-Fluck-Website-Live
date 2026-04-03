import { showToast } from '../utils/toast.js';
import { copyToClipboard } from '../utils/clipboard.js';

// ── Private helpers ────────────────────────────────────────────────────────
function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h = Math.round(h / 6 * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
    }
    return [h, s, l];
}

const PASTE_KEY = 'hf_pastes';
function getPastes() {
    try { return JSON.parse(localStorage.getItem(PASTE_KEY) || '[]'); } catch { return []; }
}
function savePastes(list) { localStorage.setItem(PASTE_KEY, JSON.stringify(list)); }

// ── JSON Formatter ─────────────────────────────────────────────────────────
export function jsonFormat() {
    const input  = document.getElementById('json-input').value.trim();
    const out    = document.getElementById('json-output');
    const status = document.getElementById('json-status');
    try {
        out.value = JSON.stringify(JSON.parse(input), null, 2);
        status.innerHTML = '<span style="color:#30d158"><i class="fas fa-check-circle"></i> Valid JSON</span>';
    } catch (e) {
        status.innerHTML = '<span style="color:#ff453a"><i class="fas fa-times-circle"></i> ' + e.message + '</span>';
    }
}

export function jsonMinify() {
    const input  = document.getElementById('json-input').value.trim();
    const out    = document.getElementById('json-output');
    const status = document.getElementById('json-status');
    try {
        out.value = JSON.stringify(JSON.parse(input));
        status.innerHTML = '<span style="color:#30d158"><i class="fas fa-check-circle"></i> Minified</span>';
    } catch (e) {
        status.innerHTML = '<span style="color:#ff453a"><i class="fas fa-times-circle"></i> ' + e.message + '</span>';
    }
}

export function jsonCopy() {
    const val = document.getElementById('json-output').value;
    if (val) copyToClipboard(val);
}

export function jsonClear() {
    document.getElementById('json-input').value  = '';
    document.getElementById('json-output').value = '';
    document.getElementById('json-status').textContent = '';
}

// ── Base64 ─────────────────────────────────────────────────────────────────
export function b64Encode() {
    const input  = document.getElementById('b64-input').value;
    const status = document.getElementById('b64-status');
    try {
        document.getElementById('b64-output').value = btoa(unescape(encodeURIComponent(input)));
        status.innerHTML = '<span style="color:#30d158"><i class="fas fa-check-circle"></i> Encoded</span>';
    } catch (e) {
        status.innerHTML = '<span style="color:#ff453a">Encode failed: ' + e.message + '</span>';
    }
}

export function b64Decode() {
    const input  = document.getElementById('b64-input').value.trim();
    const status = document.getElementById('b64-status');
    try {
        document.getElementById('b64-output').value = decodeURIComponent(escape(atob(input)));
        status.innerHTML = '<span style="color:#30d158"><i class="fas fa-check-circle"></i> Decoded</span>';
    } catch {
        status.innerHTML = '<span style="color:#ff453a">Decode failed: invalid Base64 input</span>';
    }
}

export function b64Copy() {
    const val = document.getElementById('b64-output').value;
    if (val) copyToClipboard(val);
}

// ── Colour Picker ──────────────────────────────────────────────────────────
export function updateColour(hex) {
    document.getElementById('colour-picker-input').value = hex;
    document.getElementById('colour-hex-input').value    = hex;
    document.getElementById('colour-swatch').style.background = hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const rgb = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    document.getElementById('out-hex').textContent = hex.toUpperCase();
    document.getElementById('out-rgb').textContent = rgb;
    const hsl    = rgbToHsl(r, g, b);
    const hslStr = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
    document.getElementById('out-hsl').textContent = hslStr;
    document.getElementById('out-css').textContent =
        'color: ' + hex.toUpperCase() + ';\n' +
        'background-color: ' + hex.toUpperCase() + ';\n' +
        '/* rgb: ' + rgb + ' */\n' +
        '/* hsl: ' + hslStr + ' */';
}

export function applyHexInput() {
    const val = document.getElementById('colour-hex-input').value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) updateColour(val.toLowerCase());
}

export function copyVal(id) {
    const text = document.getElementById(id)?.textContent;
    if (text) copyToClipboard(text);
}

// ── Regex Tester ───────────────────────────────────────────────────────────
export function runRegex() {
    const pattern = document.getElementById('regex-pattern').value;
    const flags   = document.getElementById('regex-flags').value;
    const input   = document.getElementById('regex-input').value;
    const output  = document.getElementById('regex-output');
    const errEl   = document.getElementById('regex-error');
    const countEl = document.getElementById('regex-count');
    errEl.textContent = '';
    if (!pattern) { output.innerHTML = escHtml(input); return; }
    try {
        const matches = Array.from(input.matchAll(new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')));
        countEl.textContent = matches.length + (matches.length === 1 ? ' match' : ' matches');
        output.innerHTML = escHtml(input).replace(
            new RegExp(escapeRegExp(pattern), flags.replace(/[^gimsuy]/g, '')),
            m => '<mark class="regex-match">' + escHtml(m) + '</mark>'
        );
    } catch (e) {
        errEl.textContent = 'Error: ' + e.message;
        output.innerHTML  = '';
        countEl.textContent = '0 matches';
    }
}

// ── Timestamp ──────────────────────────────────────────────────────────────
let clockInterval;

export function startClock() {
    clearInterval(clockInterval);
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const ms  = now.getTime();
    const s   = Math.floor(ms / 1000);
    document.getElementById('ts-now-s').textContent  = s;
    document.getElementById('ts-now-ms').textContent = ms;
    document.getElementById('ts-utc').textContent    = now.toUTCString();
    document.getElementById('ts-local').textContent  = now.toLocaleString();
    document.getElementById('ts-iso').textContent    = now.toISOString();
}

export function convertUnixToDate() {
    const val = parseInt(document.getElementById('ts-unix-in').value);
    const out = document.getElementById('ts-unix-out');
    if (isNaN(val)) { out.textContent = 'Enter a valid Unix timestamp'; return; }
    const d = new Date(val < 1e12 ? val * 1000 : val);
    out.textContent = 'UTC:    ' + d.toUTCString() + '\nLocal:  ' + d.toLocaleString() + '\nISO:    ' + d.toISOString();
}

export function convertDateToUnix() {
    const val = document.getElementById('ts-date-in').value;
    const out = document.getElementById('ts-date-out');
    if (!val) { out.textContent = 'Pick a date'; return; }
    const d = new Date(val);
    out.textContent = 'Unix (s):  ' + Math.floor(d.getTime() / 1000) + '\nUnix (ms): ' + d.getTime();
}

// ── Pastebin ───────────────────────────────────────────────────────────────
export function savePaste() {
    const code  = document.getElementById('paste-code').value;
    const title = document.getElementById('paste-title').value.trim() || 'Untitled';
    const lang  = document.getElementById('paste-lang').value;
    if (!code.trim()) { showToast('Nothing to save'); return; }
    const pastes = getPastes();
    pastes.unshift({ id: Date.now().toString(36), title, lang, code, date: new Date().toLocaleString() });
    savePastes(pastes);
    renderPasteList();
    showToast('Saved!');
}

export function copyPasteContent() {
    const val = document.getElementById('paste-code').value;
    if (val) copyToClipboard(val);
}

export function clearPaste() {
    document.getElementById('paste-code').value  = '';
    document.getElementById('paste-title').value = '';
}

export function deletePaste(id) {
    savePastes(getPastes().filter(p => p.id !== id));
    renderPasteList();
}

export function loadPasteIntoEditor(id) {
    const paste = getPastes().find(p => p.id === id);
    if (!paste) return;
    document.getElementById('paste-code').value  = paste.code;
    document.getElementById('paste-title').value = paste.title;
    document.getElementById('paste-lang').value  = paste.lang;
    showToast('Loaded into editor');
}

export function copyPasteById(id) {
    const paste = getPastes().find(p => p.id === id);
    if (paste) copyToClipboard(paste.code);
}

export function renderPasteList() {
    const pastes = getPastes();
    const list   = document.getElementById('paste-list');
    if (!pastes.length) {
        list.innerHTML = '<p style="color:var(--gray-dim);font-size:13px;margin-top:4px">No saved pastes yet. Write some code and click Save.</p>';
        return;
    }
    list.innerHTML =
        '<h4 style="font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--gray-dim);margin-bottom:10px;margin-top:4px">Saved Pastes (' + pastes.length + ')</h4>' +
        pastes.map(p => {
            const escaped = p.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<div class="paste-item">' +
                '<div class="paste-item-header">' +
                    '<span class="paste-item-title">' + p.title.replace(/</g, '&lt;') + '</span>' +
                    '<span class="badge badge-blue" style="font-size:10px">' + p.lang + '</span>' +
                    '<span style="font-size:11px;color:var(--gray-dim);flex-shrink:0">' + p.date + '</span>' +
                    '<button class="db-btn-ghost" style="font-size:11px;padding:4px 10px;flex-shrink:0" onclick="loadPasteIntoEditor(\'' + p.id + '\')"><i class="fas fa-edit"></i> Edit</button>' +
                    '<button class="db-btn-ghost" style="font-size:11px;padding:4px 10px;flex-shrink:0" onclick="copyPasteById(\'' + p.id + '\')"><i class="fas fa-copy"></i></button>' +
                    '<button class="db-btn-ghost" style="font-size:11px;padding:4px 10px;flex-shrink:0;color:#ff453a;border-color:rgba(255,69,58,0.3)" onclick="deletePaste(\'' + p.id + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
                '<div class="paste-preview"><pre><code class="language-' + p.lang + '">' + escaped + '</code></pre></div>' +
            '</div>';
        }).join('');
    if (window.hljs) {
        list.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
    }
}

// ── HTTP Request Builder ───────────────────────────────────────────────────
export function httpToggleBody() {
    const method = document.getElementById('http-method').value;
    const wrap   = document.getElementById('http-body-wrap');
    wrap.style.opacity = ['POST', 'PUT', 'PATCH'].includes(method) ? '1' : '0.4';
}

export async function sendHttpRequest() {
    const method  = document.getElementById('http-method').value;
    const url     = document.getElementById('http-url').value.trim();
    const hdrsRaw = document.getElementById('http-headers').value.trim();
    const body    = document.getElementById('http-body').value.trim();
    const errEl   = document.getElementById('http-error');
    const result  = document.getElementById('http-result');
    errEl.style.display  = 'none';
    result.style.display = 'none';
    if (!url) { errEl.textContent = 'Enter a URL.'; errEl.style.display = 'block'; return; }

    const headers = {};
    if (hdrsRaw) {
        hdrsRaw.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) headers[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
        });
    }

    const opts = { method, headers };
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) opts.body = body;

    const t0 = Date.now();
    try {
        const resp    = await fetch(url, opts);
        const elapsed = Date.now() - t0;
        const text    = await resp.text();
        let formatted = text;
        try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        document.getElementById('http-resp-body').value = formatted;
        const hdrLines = [];
        resp.headers.forEach((v, k) => hdrLines.push(k + ': ' + v));
        document.getElementById('http-resp-headers').textContent = hdrLines.join('\n') || '(none)';
        const badge = document.getElementById('http-status-badge');
        badge.textContent = resp.status + ' ' + resp.statusText;
        badge.className   = 'badge ' + (resp.ok ? 'badge-green' : 'badge-red');
        document.getElementById('http-time').textContent = elapsed + ' ms';
        result.style.display = 'block';
    } catch (e) {
        errEl.textContent   = 'Request failed: ' + e.message + '. This is likely a CORS error.';
        errEl.style.display = 'block';
    }
}

// ── JWT Decoder ────────────────────────────────────────────────────────────
export function decodeJWT() {
    const token  = document.getElementById('jwt-input').value.trim();
    const errEl  = document.getElementById('jwt-error');
    const result = document.getElementById('jwt-result');
    errEl.textContent    = '';
    result.style.display = 'none';
    if (!token) return;
    const parts = token.split('.');
    if (parts.length !== 3) { errEl.textContent = 'Invalid JWT: expected 3 parts separated by dots.'; return; }
    function b64url(s) {
        s = s.replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        return atob(s);
    }
    try {
        const header  = JSON.parse(b64url(parts[0]));
        const payload = JSON.parse(b64url(parts[1]));
        document.getElementById('jwt-header-out').textContent  = JSON.stringify(header, null, 2);
        document.getElementById('jwt-payload-out').textContent = JSON.stringify(payload, null, 2);
        document.getElementById('jwt-sig-out').textContent     = parts[2];
        const expiryEl = document.getElementById('jwt-expiry');
        if (payload.exp) {
            const exp = new Date(payload.exp * 1000), now = new Date();
            if (exp < now) {
                expiryEl.innerHTML = '<span class="badge badge-red"><i class="fas fa-times-circle"></i> Expired</span> <span style="font-size:12px;color:var(--gray);margin-left:6px">' + exp.toUTCString() + '</span>';
            } else {
                const diff = Math.round((exp - now) / 1000);
                const diffStr = diff > 3600 ? Math.round(diff / 3600) + 'h' : diff + 's';
                expiryEl.innerHTML = '<span class="badge badge-green"><i class="fas fa-check-circle"></i> Valid</span> <span style="font-size:12px;color:var(--gray);margin-left:6px">expires ' + exp.toUTCString() + ' (' + diffStr + ' remaining)</span>';
            }
        } else {
            expiryEl.textContent = '';
        }
        result.style.display = 'block';
    } catch (e) {
        errEl.textContent = 'Failed to decode: ' + e.message;
    }
}

// ── URL Encoder / Decoder ──────────────────────────────────────────────────
export function urlEncode() {
    const input  = document.getElementById('urlenc-input').value;
    const status = document.getElementById('urlenc-status');
    try {
        document.getElementById('urlenc-output').value = encodeURIComponent(input);
        status.innerHTML = '<span style="color:#30d158">Encoded.</span>';
    } catch (e) {
        status.innerHTML = '<span style="color:#ff453a">Error: ' + e.message + '</span>';
    }
}

export function urlDecode() {
    const input  = document.getElementById('urlenc-input').value;
    const status = document.getElementById('urlenc-status');
    try {
        document.getElementById('urlenc-output').value = decodeURIComponent(input);
        status.innerHTML = '<span style="color:#30d158">Decoded.</span>';
    } catch (e) {
        status.innerHTML = '<span style="color:#ff453a">Error: ' + e.message + '</span>';
    }
}

export function urlCopy() {
    const val = document.getElementById('urlenc-output').value;
    if (val) copyToClipboard(val);
}

// ── UUID Generator ─────────────────────────────────────────────────────────
export function generateUUIDs() {
    const count = Math.min(50, Math.max(1, parseInt(document.getElementById('uuid-count').value) || 1));
    const uuids = [];
    for (let i = 0; i < count; i++) {
        if (crypto.randomUUID) {
            uuids.push(crypto.randomUUID());
        } else {
            uuids.push('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            }));
        }
    }
    document.getElementById('uuid-output').textContent = uuids.join('\n');
    document.getElementById('uuid-list').style.display = 'block';
}

export function copyAllUUIDs() {
    const val = document.getElementById('uuid-output').textContent;
    if (val) copyToClipboard(val, 'Copied ' + val.split('\n').filter(Boolean).length + ' UUIDs!');
}

// ── cURL → Fetch Converter ─────────────────────────────────────────────────
export function convertCurl() {
    const input  = document.getElementById('curl-input').value.trim();
    const output = document.getElementById('curl-output');
    const errEl  = document.getElementById('curl-error');
    errEl.textContent = '';
    output.value = '';
    if (!input) { errEl.textContent = 'Enter a cURL command.'; return; }

    let cmd = input.replace(/\\\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
    cmd = cmd.replace(/^curl\s+/i, '');

    let url = null, method = null, headers = [], data = null, isForm = false;

    const tokens = [], re = /(-[^\s'"]+|'[^']*'|"(?:[^"\\]|\\.)*"|\S+)/g;
    let tm;
    while ((tm = re.exec(cmd)) !== null) tokens.push(tm[1]);

    function unq(s) {
        if ((s[0] === "'" && s[s.length - 1] === "'") || (s[0] === '"' && s[s.length - 1] === '"'))
            return s.slice(1, -1).replace(/\\(.)/g, '$1');
        return s;
    }

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t === '-X' || t === '--request')                                      { method = unq(tokens[++i]); }
        else if (t === '-H' || t === '--header')                                  { const h = unq(tokens[++i]); if (h) headers.push(h); }
        else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-ascii') { data = unq(tokens[++i]); }
        else if (t === '-F' || t === '--form')                                    { data = unq(tokens[++i]); isForm = true; }
        else if (t === '--json')                                                   { data = unq(tokens[++i]); headers.push('Content-Type: application/json'); headers.push('Accept: application/json'); }
        else if (!t.startsWith('-'))                                              { url = unq(t); }
    }

    if (!url) { errEl.textContent = 'Could not find a URL in the cURL command.'; return; }
    if (!method) method = data ? 'POST' : 'GET';

    headers = headers.filter((h, i, a) => a.indexOf(h) === i);

    const lines = [];
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(method) && data;
    lines.push("fetch('" + url + "', {");
    lines.push("  method: '" + method + "',");
    if (headers.length) {
        lines.push('  headers: {');
        headers.forEach((h, idx) => {
            const c = h.indexOf(':');
            if (c > 0) {
                const k = h.substring(0, c).trim(), v = h.substring(c + 1).trim();
                lines.push("    '" + k + "': '" + v.replace(/'/g, "\\'") + "'" + (idx < headers.length - 1 ? ',' : ''));
            }
        });
        lines.push('  }' + (hasBody ? ',' : ''));
    }
    if (hasBody) {
        if (isForm) {
            lines.push('  // FormData — convert manually if needed');
            lines.push("  body: '" + data.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'");
        } else {
            let parsed = null;
            try { parsed = JSON.parse(data); } catch {}
            lines.push(parsed !== null
                ? '  body: JSON.stringify(' + JSON.stringify(parsed, null, 4).split('\n').join('\n  ') + ')'
                : "  body: '" + data.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'");
        }
    }
    lines.push('})');
    lines.push('.then(res => res.json())');
    lines.push('.then(data => console.log(data))');
    lines.push('.catch(err => console.error(err));');
    output.value = lines.join('\n');
}

export function copyCurlOutput() {
    const val = document.getElementById('curl-output').value;
    if (val) copyToClipboard(val);
}
