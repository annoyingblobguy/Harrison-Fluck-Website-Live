import { showToast } from '../utils/toast.js';
import { copyToClipboard } from '../utils/clipboard.js';

// ── My IP ──────────────────────────────────────────────────────────────────
export function loadIPInfo() {
    const card = document.getElementById('ip-card');
    card.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gray)"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;display:block"></i>Loading...</div>';
    fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => {
            const rows = [
                ['IP address',  d.ip            || '—'],
                ['City',        d.city          || '—'],
                ['Region',      d.region        || '—'],
                ['Country',     (d.country_name || '—') + ' ' + (d.country_code || '')],
                ['ISP / Org',   d.org           || '—'],
                ['Timezone',    d.timezone      || '—'],
                ['Latitude',    d.latitude      || '—'],
                ['Longitude',   d.longitude     || '—'],
            ];
            card.innerHTML = '<h4 style="margin-bottom:12px">Network Information</h4>' +
                rows.map(r =>
                    '<div class="db-info-row"><span class="lbl">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'
                ).join('');
        })
        .catch(() => {
            card.innerHTML = '<p style="color:#ff453a;font-size:14px">Failed to fetch IP info. Try again.</p>';
        });
}

// ── Password Generator ─────────────────────────────────────────────────────
export function generatePassword() {
    const len   = parseInt(document.getElementById('pass-length').value);
    const upper = document.getElementById('pass-upper').checked;
    const lower = document.getElementById('pass-lower').checked;
    const digs  = document.getElementById('pass-digits').checked;
    const syms  = document.getElementById('pass-symbols').checked;

    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (digs)  chars += '0123456789';
    if (syms)  chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
    if (!chars) { showToast('Select at least one character type'); return; }

    const arr  = new Uint32Array(len);
    crypto.getRandomValues(arr);
    const pass = Array.from(arr).map(n => chars[n % chars.length]).join('');
    document.getElementById('pass-value').textContent = pass;

    const score  = (upper ? 1 : 0) + (lower ? 1 : 0) + (digs ? 1 : 0) + (syms ? 1 : 0);
    const pct    = Math.min(100, (len / 64) * 60 + score * 10);
    const fill   = document.getElementById('pass-strength-fill');
    const label  = document.getElementById('pass-strength-label');
    let colour, txt;
    if (pct < 40)      { colour = '#ff453a'; txt = 'Weak'; }
    else if (pct < 65) { colour = '#ff9f0a'; txt = 'Fair'; }
    else if (pct < 80) { colour = '#ffd60a'; txt = 'Good'; }
    else               { colour = '#30d158'; txt = 'Strong'; }
    fill.style.width      = pct + '%';
    fill.style.background = colour;
    label.innerHTML = '<span style="color:' + colour + '">' + txt + '</span> &mdash; ' + len + ' characters, ' + score + '/4 character types';
}

export function copyPassword() {
    const val = document.getElementById('pass-value').textContent;
    if (val && val !== 'Click generate to create a password') {
        copyToClipboard(val, 'Password copied!');
    }
}
