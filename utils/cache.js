const DEFAULT_TTL_MS = 60_000;
const store = new Map();

function set(key, value, ttl = DEFAULT_TTL_MS) {
    store.set(key, {
        value,
        expiresAt: Date.now() + ttl
    });
}

function get(key) {
    const entry = store.get(key);
    if (!entry) {
        return null;
    }

    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }

    return entry.value;
}

function del(key) {
    store.delete(key);
}

function clear() {
    store.clear();
}

module.exports = {
    set,
    get,
    del,
    clear
};
