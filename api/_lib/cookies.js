// Utilidades mínimas de cookies (sin dependencias externas).

function parseCookies(req) {
    const header = req.headers.cookie;
    const out = {};
    if (!header) return out;
    header.split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return;
        const key = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        out[key] = decodeURIComponent(val);
    });
    return out;
}

function serializeCookie(name, value, opts = {}) {
    let str = `${name}=${encodeURIComponent(value)}`;
    str += '; Path=' + (opts.path || '/');
    if (opts.maxAge != null) str += '; Max-Age=' + Math.floor(opts.maxAge);
    if (opts.httpOnly !== false) str += '; HttpOnly';
    str += '; SameSite=' + (opts.sameSite || 'Lax');
    if (opts.secure !== false) str += '; Secure';
    return str;
}

function setCookie(res, name, value, opts) {
    const cookieStr = serializeCookie(name, value, opts);
    const prev = res.getHeader('Set-Cookie');
    if (!prev) {
        res.setHeader('Set-Cookie', cookieStr);
    } else if (Array.isArray(prev)) {
        res.setHeader('Set-Cookie', [...prev, cookieStr]);
    } else {
        res.setHeader('Set-Cookie', [prev, cookieStr]);
    }
}

function clearCookie(res, name) {
    setCookie(res, name, '', { maxAge: 0 });
}

module.exports = { parseCookies, setCookie, clearCookie };
