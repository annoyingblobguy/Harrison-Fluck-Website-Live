// Shared fetch utilities
export async function apiJson(url, opts = {}) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
}

export async function apiText(url, opts = {}) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
}
