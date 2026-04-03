import { showToast } from '../utils/toast.js';
import { copyToClipboard } from '../utils/clipboard.js';

// ── IP Geolocation (module-level state for Leaflet) ────────────────────────
let _geoMap = null;
let _geoMarker = null;

// ── SSL Checker (module-level poll timer) ──────────────────────────────────
let _sslPollTimer = null;

// ── DNS Lookup via Cloudflare DoH ──────────────────────────────────────────
export function dnsLookup() {
    const domain = document.getElementById('dns-domain').value.trim();
    const type   = document.getElementById('dns-type').value;
    const result = document.getElementById('dns-result');
    const errEl  = document.getElementById('dns-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!domain) { errEl.textContent = 'Enter a domain name.'; errEl.style.display = 'block'; return; }

    fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(domain) + '&type=' + type, {
        headers: { 'Accept': 'application/dns-json' }
    })
    .then(r => r.json())
    .then(data => {
        document.getElementById('dns-result-title').textContent = type + ' records for ' + domain;
        const body = document.getElementById('dns-result-body');
        if (!data.Answer || !data.Answer.length) {
            body.innerHTML = '<p style="color:var(--gray);font-size:14px;padding:8px 0">No ' + type + ' records found for this domain.</p>';
        } else {
            body.innerHTML = data.Answer.map(rec =>
                '<div class="db-info-row"><span class="lbl">' + rec.type + '</span>' +
                '<span class="val" style="word-break:break-all;max-width:70%">' +
                rec.data + ' <span style="color:var(--gray-dim);font-size:11px;margin-left:6px">TTL ' + rec.TTL + 's</span>' +
                '</span></div>'
            ).join('');
        }
        result.style.display = 'block';
    })
    .catch(e => {
        errEl.textContent = 'DNS lookup failed: ' + e.message;
        errEl.style.display = 'block';
    });
}

// ── Ping (HTTP RTT) ────────────────────────────────────────────────────────
export function doPing() {
    const host   = document.getElementById('ping-host').value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const result = document.getElementById('ping-result');
    const errEl  = document.getElementById('ping-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!host) { errEl.textContent = 'Enter a host.'; errEl.style.display = 'block'; return; }

    const attempts = 4;
    const rtts = [];
    let done = 0;

    document.getElementById('ping-result-body').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Pinging ' + host + '…</p>';
    result.style.display = 'block';

    function attempt() {
        const start = Date.now();
        fetch('https://' + host + '/?_cb=' + Date.now(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
            .then(() => { rtts.push(Date.now() - start); })
            .catch(() => {})
            .finally(() => {
                done++;
                if (done === attempts) showPingResults(host, rtts, attempts);
            });
    }

    for (let i = 0; i < attempts; i++) {
        setTimeout(attempt, i * 350);
    }
}

function showPingResults(host, rtts, attempts) {
    const body = document.getElementById('ping-result-body');
    const loss = Math.round(((attempts - rtts.length) / attempts) * 100);
    if (!rtts.length) {
        body.innerHTML =
            '<div class="db-info-row"><span class="lbl">Status</span><span class="val"><span class="badge badge-red">Unreachable</span></span></div>' +
            '<div class="db-info-row"><span class="lbl">Host</span><span class="val">' + host + '</span></div>' +
            '<p style="font-size:12px;color:var(--gray-dim);margin-top:10px">Host may be down, not serving HTTPS, or blocked on your network.</p>';
        return;
    }
    const min = Math.min(...rtts);
    const max = Math.max(...rtts);
    const avg = Math.round(rtts.reduce((a, b) => a + b, 0) / rtts.length);
    body.innerHTML =
        '<div class="db-info-row"><span class="lbl">Status</span><span class="val"><span class="badge badge-green">Reachable</span></span></div>' +
        '<div class="db-info-row"><span class="lbl">Host</span><span class="val">' + host + '</span></div>' +
        '<div class="db-info-row"><span class="lbl">Min RTT</span><span class="val">' + min + ' ms</span></div>' +
        '<div class="db-info-row"><span class="lbl">Avg RTT</span><span class="val">' + avg + ' ms</span></div>' +
        '<div class="db-info-row"><span class="lbl">Max RTT</span><span class="val">' + max + ' ms</span></div>' +
        '<div class="db-info-row"><span class="lbl">Packet loss</span><span class="val">' + loss + '%</span></div>' +
        '<div class="db-info-row"><span class="lbl">Samples</span><span class="val">' + rtts.length + ' / ' + attempts + '</span></div>';
}

// ── Port Check via HackerTarget ────────────────────────────────────────────
export function setPort(p) { document.getElementById('port-port').value = p; }

export function checkPort() {
    const host   = document.getElementById('port-host').value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const port   = parseInt(document.getElementById('port-port').value);
    const result = document.getElementById('port-result');
    const errEl  = document.getElementById('port-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!host)                              { errEl.textContent = 'Enter a host.'; errEl.style.display = 'block'; return; }
    if (!port || port < 1 || port > 65535) { errEl.textContent = 'Enter a valid port (1–65535).'; errEl.style.display = 'block'; return; }

    document.getElementById('port-result-body').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Checking ' + host + ':' + port + '…</p>';
    result.style.display = 'block';

    fetch('https://api.hackertarget.com/nmap/?q=' + encodeURIComponent(host + ':' + port))
        .then(r => r.text())
        .then(text => {
            if (text.includes('error') && text.includes('API count')) {
                errEl.textContent = 'HackerTarget rate limit reached. Wait a minute and try again.';
                errEl.style.display = 'block';
                result.style.display = 'none';
                return;
            }
            const open   = /open/i.test(text);
            const status = open
                ? '<span class="badge badge-green">Open</span>'
                : '<span class="badge badge-red">Closed / Filtered</span>';
            document.getElementById('port-result-body').innerHTML =
                '<div class="db-info-row"><span class="lbl">Status</span><span class="val">' + status + '</span></div>' +
                '<div class="db-info-row"><span class="lbl">Host</span><span class="val">' + host + '</span></div>' +
                '<div class="db-info-row"><span class="lbl">Port</span><span class="val">' + port + '</span></div>' +
                '<div class="db-output" style="margin-top:10px;font-size:12px">' +
                    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                '</div>';
        })
        .catch(() => {
            errEl.textContent = 'Port check failed. Check your connection or try again shortly.';
            errEl.style.display = 'block';
            result.style.display = 'none';
        });
}

// ── WHOIS via RDAP ─────────────────────────────────────────────────────────
export function doWhois() {
    let query  = document.getElementById('whois-query').value.trim();
    const result = document.getElementById('whois-result');
    const errEl  = document.getElementById('whois-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!query) { errEl.textContent = 'Enter a domain or IP address.'; errEl.style.display = 'block'; return; }

    query = query.replace(/^https?:\/\//, '').split('/')[0];
    const isIP  = /^(\d{1,3}\.){3}\d{1,3}$/.test(query) || /^[0-9a-f:]{2,}$/i.test(query);
    const apiUrl = isIP
        ? 'https://rdap.org/ip/' + encodeURIComponent(query)
        : 'https://rdap.org/domain/' + encodeURIComponent(query);

    document.getElementById('whois-result-title').textContent = 'WHOIS — ' + query;
    document.getElementById('whois-result-body').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Looking up…</p>';
    result.style.display = 'block';

    fetch(apiUrl)
        .then(r => {
            if (!r.ok) throw new Error('Not found (HTTP ' + r.status + ')');
            return r.json();
        })
        .then(d => {
            const rows = [];
            if (d.ldhName || d.handle) rows.push(['Domain / Handle', d.ldhName || d.handle]);
            if (d.startAddress)        rows.push(['IP range start', d.startAddress]);
            if (d.endAddress)          rows.push(['IP range end',   d.endAddress]);
            if (d.ipVersion)           rows.push(['IP version', d.ipVersion]);
            if (d.type)                rows.push(['Type', d.type]);
            if (d.status && d.status.length) rows.push(['Status', d.status.join(', ')]);
            if (d.country)             rows.push(['Country', d.country]);

            if (d.entities) {
                d.entities.forEach(e => {
                    if (!e.vcardArray || !e.roles) return;
                    let name = '';
                    e.vcardArray[1].forEach(v => { if (v[0] === 'fn') name = v[3]; });
                    if (name) rows.push([e.roles.join(' / '), name]);
                });
            }

            if (d.events) {
                d.events.forEach(ev => {
                    const label = ev.eventAction.replace(/-/g, ' ');
                    rows.push([label, new Date(ev.eventDate).toLocaleString()]);
                });
            }

            if (!rows.length) {
                document.getElementById('whois-result-body').innerHTML =
                    '<div class="db-output" style="font-size:12px;white-space:pre-wrap">' +
                    JSON.stringify(d, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
            } else {
                document.getElementById('whois-result-body').innerHTML = rows.map(r =>
                    '<div class="db-info-row"><span class="lbl">' + r[0] +
                    '</span><span class="val" style="word-break:break-all;max-width:65%">' + r[1] + '</span></div>'
                ).join('');
            }
        })
        .catch(e => {
            errEl.textContent = 'WHOIS lookup failed: ' + e.message + '. Try without "www" prefix.';
            errEl.style.display = 'block';
            result.style.display = 'none';
        });
}

// ── Traceroute (MTR via HackerTarget) ──────────────────────────────────────
export function doTraceroute() {
    const host   = document.getElementById('traceroute-host').value.trim().replace(/^https?:\/\//, '').split('/')[0];
    const result = document.getElementById('traceroute-result');
    const errEl  = document.getElementById('traceroute-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!host) { errEl.textContent = 'Enter a host.'; errEl.style.display = 'block'; return; }

    document.getElementById('traceroute-result-title').textContent = 'Traceroute — ' + host;
    document.getElementById('traceroute-result-body').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Tracing route to ' + host + '… (may take 10–20s)</p>';
    result.style.display = 'block';

    fetch('https://api.hackertarget.com/mtr/?q=' + encodeURIComponent(host))
        .then(r => r.text())
        .then(text => {
            if (/error|API count/i.test(text)) {
                errEl.textContent = 'HackerTarget rate limit reached. Wait a minute and try again.';
                errEl.style.display = 'block';
                result.style.display = 'none';
                return;
            }
            const lines = text.split('\n').filter(l => /^\s*\d+\./.test(l));
            if (!lines.length) {
                document.getElementById('traceroute-result-body').innerHTML =
                    '<p style="color:var(--gray);font-size:14px">No hops found — host may be unreachable.</p>';
                return;
            }
            let maxAvg = 0;
            const hops = lines.map(line => {
                const parts = line.trim().split(/\s+/);
                const num   = parts[0].replace(/[^0-9]/g, '');
                const iface = parts[1] || '???';
                const loss  = parts[2] || '?%';
                const avg   = parseFloat(parts[5]) || 0;
                if (avg > maxAvg) maxAvg = avg;
                return { num, iface, loss, avg };
            });
            document.getElementById('traceroute-result-body').innerHTML = hops.map(h => {
                const barW     = maxAvg > 0 ? Math.max(4, Math.round((h.avg / maxAvg) * 80)) : 4;
                const latColor = h.avg < 20 ? '#30d158' : h.avg < 80 ? '#ffd60a' : '#ff453a';
                return '<div class="hop-row">' +
                    '<span class="hop-num">' + h.num + '</span>' +
                    '<span class="hop-host">' + h.iface + '</span>' +
                    '<span class="hop-loss" style="color:' + (parseFloat(h.loss) > 0 ? '#ff9f0a' : 'var(--gray)') + '">' + h.loss + '</span>' +
                    '<span class="hop-latency" style="color:' + latColor + '">' + (h.avg ? h.avg.toFixed(1) + 'ms' : '—') + '</span>' +
                    '<div class="hop-bar-wrap"><div class="hop-bar" style="width:' + barW + 'px;background:' + latColor + '"></div></div>' +
                    '</div>';
            }).join('');
        })
        .catch(e => {
            errEl.textContent = 'Traceroute failed: ' + e.message;
            errEl.style.display = 'block';
            result.style.display = 'none';
        });
}

// ── IP Geolocation (ipapi.co + Leaflet) ───────────────────────────────────
export function doGeoIP() {
    const query  = document.getElementById('geoip-query').value.trim().replace(/^https?:\/\//, '').split('/')[0];
    const result = document.getElementById('geoip-result');
    const errEl  = document.getElementById('geoip-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!query) { errEl.textContent = 'Enter an IP address or domain.'; errEl.style.display = 'block'; return; }

    fetch('https://ipapi.co/' + encodeURIComponent(query) + '/json/')
        .then(r => r.json())
        .then(d => {
            if (d.error) { errEl.textContent = d.reason || 'Lookup failed.'; errEl.style.display = 'block'; return; }

            result.style.display = 'block';

            const lat = d.latitude, lng = d.longitude;
            if (lat && lng) {
                setTimeout(() => {
                    if (!_geoMap) {
                        _geoMap = L.map('geoip-map').setView([lat, lng], 10);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors', maxZoom: 18
                        }).addTo(_geoMap);
                        _geoMarker = L.marker([lat, lng]).addTo(_geoMap);
                    } else {
                        _geoMap.setView([lat, lng], 10);
                        if (_geoMarker) _geoMarker.setLatLng([lat, lng]);
                        _geoMap.invalidateSize();
                    }
                    _geoMarker.bindPopup('<b>' + (d.city || '') + '</b><br>' + (d.country_name || '')).openPopup();
                }, 50);
            }

            const rows = [];
            if (d.ip)           rows.push(['IP Address', d.ip]);
            if (d.city)         rows.push(['City', d.city]);
            if (d.region)       rows.push(['Region', d.region]);
            if (d.country_name) rows.push(['Country', d.country_name + ' ' + (d.country_code || '')]);
            if (d.postal)       rows.push(['Postal code', d.postal]);
            if (d.timezone)     rows.push(['Timezone', d.timezone]);
            if (d.org)          rows.push(['ISP / Org', d.org]);
            if (d.asn)          rows.push(['ASN', d.asn]);
            if (lat && lng)     rows.push(['Coordinates', lat.toFixed(4) + ', ' + lng.toFixed(4)]);

            document.getElementById('geoip-result-body').innerHTML = rows.map(r =>
                '<div class="db-info-row"><span class="lbl">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'
            ).join('');
        })
        .catch(e => {
            errEl.textContent = 'Geolocation lookup failed: ' + e.message;
            errEl.style.display = 'block';
        });
}

// Called when geoip tab becomes visible — must invalidate Leaflet map size
export function invalidateGeoMap() {
    if (_geoMap) setTimeout(() => _geoMap.invalidateSize(), 50);
}

// ── SSL Certificate Checker (SSL Labs API) ─────────────────────────────────
export function checkSSL() {
    const domain = document.getElementById('ssl-domain').value.trim().replace(/^https?:\/\//, '').split('/')[0];
    const result = document.getElementById('ssl-result');
    const errEl  = document.getElementById('ssl-error');
    result.style.display = 'none';
    errEl.style.display  = 'none';
    if (!domain) { errEl.textContent = 'Enter a domain name.'; errEl.style.display = 'block'; return; }
    if (_sslPollTimer) { clearInterval(_sslPollTimer); _sslPollTimer = null; }

    document.getElementById('ssl-grade-val').textContent = '…';
    document.getElementById('ssl-grade-val').className = 'ssl-grade';
    document.getElementById('ssl-grade-sub').textContent = 'Scanning…';
    document.getElementById('ssl-cert-body').innerHTML = '<p style="color:var(--gray);font-size:13px"><i class="fas fa-spinner fa-spin"></i> Fetching…</p>';
    document.getElementById('ssl-expiry-body').innerHTML = '';
    document.getElementById('ssl-details-body').innerHTML = '';
    result.style.display = 'block';

    function fetchSSL(startNew) {
        const url = 'https://api.ssllabs.com/api/v3/analyze?host=' + encodeURIComponent(domain) +
                    (startNew ? '&startNew=on' : '&fromCache=on&maxAge=24') + '&all=done';
        fetch(url)
            .then(r => r.json())
            .then(d => {
                if (d.status === 'READY') {
                    if (_sslPollTimer) { clearInterval(_sslPollTimer); _sslPollTimer = null; }
                    renderSSL(domain, d);
                } else if (d.status === 'ERROR') {
                    if (_sslPollTimer) { clearInterval(_sslPollTimer); _sslPollTimer = null; }
                    errEl.textContent = 'SSL Labs error: ' + (d.statusMessage || 'Unknown error');
                    errEl.style.display = 'block';
                    result.style.display = 'none';
                } else {
                    const msg = d.status === 'DNS' ? 'Resolving DNS…' : 'Scan in progress (' + (d.status || '') + ')…';
                    document.getElementById('ssl-grade-sub').textContent = msg;
                    if (!_sslPollTimer) {
                        _sslPollTimer = setInterval(() => fetchSSL(false), 8000);
                    }
                }
            })
            .catch(e => {
                if (_sslPollTimer) { clearInterval(_sslPollTimer); _sslPollTimer = null; }
                if (startNew) {
                    errEl.textContent = 'SSL check failed: ' + e.message;
                    errEl.style.display = 'block';
                    result.style.display = 'none';
                } else {
                    fetchSSL(true);
                }
            });
    }

    fetchSSL(false);
}

function renderSSL(domain, d) {
    const ep    = d.endpoints && d.endpoints[0];
    const grade = ep ? ep.grade : '?';
    const gradeEl = document.getElementById('ssl-grade-val');
    gradeEl.textContent = grade || '?';
    gradeEl.className = 'ssl-grade grade-' + (grade ? grade[0].toLowerCase() : 'f');
    document.getElementById('ssl-grade-sub').textContent = ep && ep.hasWarnings ? 'Warnings present' : 'No warnings';

    const cert = d.certs && d.certs[0];
    if (cert) {
        document.getElementById('ssl-cert-body').innerHTML =
            '<div class="db-info-row" style="flex-direction:column;align-items:flex-start;gap:2px">' +
            '<span class="lbl">Subject</span><span class="val" style="font-size:12px;word-break:break-all">' + (cert.subject || '—') + '</span></div>' +
            '<div class="db-info-row" style="flex-direction:column;align-items:flex-start;gap:2px">' +
            '<span class="lbl">Issuer</span><span class="val" style="font-size:12px">' + (cert.issuerLabel || '—') + '</span></div>' +
            '<div class="db-info-row"><span class="lbl">Key</span><span class="val">' + (cert.keyAlg || '') + ' ' + (cert.keyStrength || '') + '-bit</span></div>';

        const notAfter  = cert.notAfter  ? new Date(cert.notAfter)  : null;
        const notBefore = cert.notBefore ? new Date(cert.notBefore) : null;
        const now       = new Date();
        const daysLeft  = notAfter ? Math.round((notAfter - now) / 86400000) : null;
        const expiryColor = daysLeft === null ? 'var(--gray)' : daysLeft < 14 ? '#ff453a' : daysLeft < 30 ? '#ffd60a' : '#30d158';
        document.getElementById('ssl-expiry-body').innerHTML =
            (notBefore ? '<div class="db-info-row"><span class="lbl">Valid from</span><span class="val" style="font-size:12px">' + notBefore.toLocaleDateString() + '</span></div>' : '') +
            (notAfter  ? '<div class="db-info-row"><span class="lbl">Expires</span><span class="val" style="font-size:12px">' + notAfter.toLocaleDateString() + '</span></div>' : '') +
            (daysLeft !== null ? '<div class="db-info-row"><span class="lbl">Days left</span><span class="val" style="color:' + expiryColor + ';font-weight:700">' + daysLeft + ' days</span></div>' : '');
    }

    const detailRows = [];
    if (ep && ep.ipAddress)      detailRows.push(['Server IP', ep.ipAddress]);
    if (d.protocol)              detailRows.push(['Protocol', d.protocol]);
    if (ep && ep.statusMessage)  detailRows.push(['Status', ep.statusMessage]);
    detailRows.push(['Tested', new Date().toLocaleString()]);
    document.getElementById('ssl-details-body').innerHTML = detailRows.map(r =>
        '<div class="db-info-row"><span class="lbl">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'
    ).join('');
}

// ── Website Status Monitor ─────────────────────────────────────────────────
export function checkUptime() {
    const raw    = document.getElementById('uptime-url').value.trim();
    const errEl  = document.getElementById('uptime-error');
    const result = document.getElementById('uptime-result');
    errEl.style.display  = 'none';
    result.style.display = 'none';

    if (!raw) { errEl.textContent = 'Enter a URL.'; errEl.style.display = 'block'; return; }
    const url  = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
    const host = url.replace(/^https?:\/\//, '').split('/')[0];

    document.getElementById('uptime-result-body').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Checking ' + host + '…</p>';
    result.style.display = 'block';

    const browserStart = Date.now();
    let browserStatus = 'unknown', browserRtt = null;
    let apiDone = false, browserDone = false;
    let apiStatus = null, apiCode = null, apiServer = null;

    function finish() {
        if (!apiDone || !browserDone) return;
        const up = apiStatus === 'up' || browserStatus === 'reachable';
        let body = '<div class="db-info-row"><span class="lbl">Status</span><span class="val">' +
            (up ? '<span class="badge badge-green">Online</span>' : '<span class="badge badge-red">Offline / Unreachable</span>') +
            '</span></div>' +
            '<div class="db-info-row"><span class="lbl">Host</span><span class="val">' + host + '</span></div>';
        if (apiCode)   body += '<div class="db-info-row"><span class="lbl">HTTP status</span><span class="val">' + apiCode + '</span></div>';
        if (apiServer) body += '<div class="db-info-row"><span class="lbl">Server</span><span class="val">' + apiServer + '</span></div>';
        if (browserRtt !== null) body += '<div class="db-info-row"><span class="lbl">Browser RTT</span><span class="val">' + browserRtt + ' ms</span></div>';
        body += '<div class="db-info-row"><span class="lbl">Checked</span><span class="val">' + new Date().toLocaleTimeString() + '</span></div>';
        document.getElementById('uptime-result-body').innerHTML = body;
    }

    fetch(url + (url.includes('?') ? '&' : '?') + '_cb=' + Date.now(), { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        .then(() => { browserStatus = 'reachable'; browserRtt = Date.now() - browserStart; })
        .catch(() => { browserStatus = 'unreachable'; })
        .finally(() => { browserDone = true; finish(); });

    fetch('https://api.hackertarget.com/httpheaders/?q=' + encodeURIComponent(url))
        .then(r => r.text())
        .then(text => {
            if (/error|API count/i.test(text)) { apiStatus = 'unknown'; apiDone = true; finish(); return; }
            const codeMatch = text.match(/HTTP\/[\d.]+ (\d{3})/i);
            if (codeMatch) { apiCode = codeMatch[1]; apiStatus = parseInt(codeMatch[1]) < 500 ? 'up' : 'down'; }
            const srvMatch = text.match(/^[Ss]erver:\s*(.+)$/m);
            if (srvMatch) apiServer = srvMatch[1].trim();
            apiDone = true; finish();
        })
        .catch(() => { apiStatus = 'unknown'; apiDone = true; finish(); });
}

// ── Headers Inspector ──────────────────────────────────────────────────────
export function inspectHeaders() {
    const raw    = document.getElementById('headers-url').value.trim();
    const errEl  = document.getElementById('headers-error');
    const result = document.getElementById('headers-result');
    errEl.style.display   = 'none';
    result.style.display  = 'none';

    if (!raw) { errEl.textContent = 'Enter a URL.'; errEl.style.display = 'block'; return; }
    const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;

    document.getElementById('headers-summary').innerHTML =
        '<p style="color:var(--gray);font-size:14px"><i class="fas fa-spinner fa-spin"></i> Fetching headers…</p>';
    result.style.display = 'block';
    document.getElementById('headers-result-body').innerHTML = '';

    fetch('https://api.hackertarget.com/httpheaders/?q=' + encodeURIComponent(url))
        .then(r => r.text())
        .then(text => {
            if (/error|API count/i.test(text)) {
                errEl.textContent = 'HackerTarget rate limit reached. Wait a minute and try again.';
                errEl.style.display = 'block';
                result.style.display = 'none';
                return;
            }

            const lines      = text.split('\n').filter(l => l.trim());
            const statusLine = lines[0] || '';
            const codeMatch  = statusLine.match(/HTTP\/[\d.]+ (\d{3}[^\r\n]*)/i);
            const statusCode = codeMatch ? codeMatch[1] : statusLine;
            const isOk       = /^[123]/.test(statusCode);

            document.getElementById('headers-summary').innerHTML =
                '<div class="db-info-row"><span class="lbl">Status</span><span class="val">' +
                '<span class="badge ' + (isOk ? 'badge-green' : 'badge-red') + '">HTTP ' + statusCode + '</span>' +
                '</span></div>' +
                '<div class="db-info-row"><span class="lbl">URL</span><span class="val" style="word-break:break-all;font-size:12px">' + url + '</span></div>';

            const headers = [];
            lines.slice(1).forEach(line => {
                const sep = line.indexOf(':');
                if (sep < 0) return;
                const name = line.slice(0, sep).trim();
                const val  = line.slice(sep + 1).trim();
                if (name) headers.push({ name, val });
            });

            const cats = {
                'Security': ['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','x-xss-protection','referrer-policy','permissions-policy','cross-origin-opener-policy','cross-origin-resource-policy','cross-origin-embedder-policy'],
                'Caching':  ['cache-control','expires','etag','last-modified','age','pragma','vary'],
                'Server':   ['server','x-powered-by','via','x-forwarded-for','x-real-ip','host'],
                'Content':  ['content-type','content-length','content-encoding','content-language','transfer-encoding'],
                'Other':    []
            };
            const grouped = { Security: [], Caching: [], Server: [], Content: [], Other: [] };
            headers.forEach(h => {
                const lower = h.name.toLowerCase();
                let found = false;
                ['Security','Caching','Server','Content'].forEach(cat => {
                    if (!found && cats[cat].includes(lower)) { grouped[cat].push(h); found = true; }
                });
                if (!found) grouped.Other.push(h);
            });

            let html = '';
            ['Security','Caching','Content','Server','Other'].forEach(cat => {
                if (!grouped[cat].length) return;
                html += '<div class="db-card" style="margin-top:10px"><div class="hdr-cat">' + cat + '</div>';
                grouped[cat].forEach(h => {
                    html += '<div class="db-info-row">' +
                        '<span class="lbl" style="font-family:\'SF Mono\',monospace;font-size:11px">' + h.name + '</span>' +
                        '<span class="val" style="font-size:12px;word-break:break-all;max-width:65%">' +
                        h.val.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></div>';
                });
                html += '</div>';
            });

            document.getElementById('headers-result-body').innerHTML =
                html || '<p style="color:var(--gray);font-size:14px">No headers returned.</p>';
        })
        .catch(e => {
            errEl.textContent = 'Headers fetch failed: ' + e.message;
            errEl.style.display = 'block';
            result.style.display = 'none';
        });
}
