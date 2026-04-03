// ── METAR / TAF ────────────────────────────────────────────────────────────
export function setICAO(code) {
    document.getElementById('metar-icao').value = code;
    fetchWeather();
}

export function fetchWeather() {
    const icao = document.getElementById('metar-icao').value.trim().toUpperCase();
    const type = document.getElementById('metar-type').value;
    const err  = document.getElementById('metar-error');
    const res  = document.getElementById('metar-result');
    err.style.display = 'none';
    res.style.display = 'none';

    if (!icao || icao.length < 3) {
        err.textContent = 'Enter a valid ICAO code (e.g. YBBN)';
        err.style.display = 'block';
        return;
    }

    const apiUrl = type === 'metar'
        ? 'https://aviationweather.gov/api/data/metar?ids=' + icao + '&format=json&hours=2'
        : 'https://aviationweather.gov/api/data/taf?ids=' + icao + '&format=json';

    function handleData(data) {
        if (!data || !data.length) {
            err.textContent = 'No data found for ' + icao + '. Check the ICAO code.';
            err.style.display = 'block';
            return;
        }
        const d = data[0];
        document.getElementById('metar-raw-out').textContent = d.rawOb || d.rawTAF || JSON.stringify(d, null, 2);
        document.getElementById('metar-decoded').innerHTML = decodeMETAR(d, type);
        res.style.display = 'block';
    }

    fetch(apiUrl)
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(handleData)
        .catch(() => {
            fetch('https://corsproxy.io/?' + encodeURIComponent(apiUrl))
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(handleData)
                .catch(() => {
                    err.textContent = 'Could not fetch weather data. The Aviation Weather Center may be unavailable, or your network is blocking the request.';
                    err.style.display = 'block';
                });
        });
}

function decodeMETAR(d, type) {
    if (type === 'taf') {
        return '<p style="font-size:14px;color:var(--gray)">TAF valid from <strong style="color:var(--white)">' +
            (d.validTimeFrom || '—') + '</strong> to <strong style="color:var(--white)">' + (d.validTimeTo || '—') + '</strong></p>';
    }
    const rows = [
        ['Station',          d.icaoId || '—'],
        ['Station name',     d.name || '—'],
        ['Observation time', d.reportTime ? new Date(d.reportTime).toLocaleString() : '—'],
        ['Temperature',      d.temp  != null ? d.temp  + ' °C' : '—'],
        ['Dewpoint',         d.dewp  != null ? d.dewp  + ' °C' : '—'],
        ['Wind',             d.wdir  != null ? d.wdir + '° at ' + d.wspd + ' kt' + (d.wgst ? ' gusts ' + d.wgst + ' kt' : '') : '—'],
        ['Visibility',       d.visib != null ? (d.visib >= 9999 ? '10+ km (CAVOK)' : d.visib + ' m') : '—'],
        ['Altimeter',        d.altim != null ? d.altim.toFixed(1) + ' hPa' : '—'],
        ['Weather',          d.wxString || 'NIL'],
    ];
    if (d.clouds && d.clouds.length) {
        rows.push(['Clouds', d.clouds.map(c => c.cover + ' at ' + (c.base * 100) + ' ft').join(' · ')]);
    }
    return rows.map(r =>
        '<div class="db-info-row"><span class="lbl">' + r[0] + '</span><span class="val">' + r[1] + '</span></div>'
    ).join('');
}
