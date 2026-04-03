// Persistent app state (localStorage)
const K = {
    fav:    'hf_favorites',
    recent: 'hf_recent',
    prefs:  'hf_prefs',
};

const load = (k, d) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? d; }
    catch { return d; }
};

const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const getFavorites = () => load(K.fav, []);
export const setFavorites = arr => save(K.fav, arr);

export function toggleFavorite(id) {
    const f = getFavorites();
    const i = f.indexOf(id);
    i >= 0 ? f.splice(i, 1) : f.push(id);
    save(K.fav, f);
    return f;
}

export const getRecent = () => load(K.recent, []);

export function addRecent(id) {
    let r = getRecent().filter(x => x !== id);
    r.unshift(id);
    if (r.length > 10) r = r.slice(0, 10);
    save(K.recent, r);
}

export const getPrefs = () => load(K.prefs, {});
export const setPrefs = obj => save(K.prefs, obj);
