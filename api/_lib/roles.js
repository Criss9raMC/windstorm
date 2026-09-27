// Mapeo entre los IDs de rol de tu servidor de Discord y las "llaves" que
// usa el sitio internamente. Si algún día cambias o agregas roles en
// Discord, solo actualiza este archivo.

const ROLE_MAP = {
    '1508972632014459052': { key: 'admin', label: 'Admin', color: '#f43f5e' },
    '1508980854137946254': { key: 'constructor', label: 'Constructor', color: '#22c55e' },
    '1509086537189560382': { key: 'programador', label: 'Programador', color: '#a855f7' },
    '1509342315477733386': { key: 'moderacion', label: 'Moderación', color: '#eab308' },
    '1509073843602591796': { key: 'moderacion', label: 'Moderación', color: '#eab308' },
    '1509641010240819400': { key: 'tester', label: 'Tester', color: '#06b6d4' },
};

// Orden de prioridad para decidir el "rol principal" a mostrar cuando
// alguien tiene más de uno. Admin y Moderación pueden borrar cualquier
// nota (ver MANAGER_ROLES en notes.js); por ahora no hay más diferencia
// entre los dos.
const PRIORITY = ['admin', 'programador', 'moderacion', 'constructor', 'tester'];

/**
 * Recibe la lista de IDs de rol que Discord devuelve para el miembro y
 * regresa { primary: {key,label,color}, allKeys: string[] } o null si no
 * tiene ningún rol de staff.
 */
function resolveRoles(discordRoleIds) {
    const matched = [];
    const seenKeys = new Set();

    for (const id of discordRoleIds) {
        const info = ROLE_MAP[id];
        if (info && !seenKeys.has(info.key)) {
            seenKeys.add(info.key);
            matched.push(info);
        }
    }

    if (matched.length === 0) return null;

    matched.sort((a, b) => PRIORITY.indexOf(a.key) - PRIORITY.indexOf(b.key));

    return {
        primary: matched[0],
        allKeys: matched.map((m) => m.key),
    };
}

// Roles que pueden borrar la nota de cualquier persona (no solo la propia).
// Hoy Admin y Moderación hacen lo mismo; si en el futuro quieres darle algo
// extra solo a Admin, aquí es donde se separarían.
const MANAGER_ROLES = ['admin', 'moderacion'];

module.exports = { ROLE_MAP, resolveRoles, MANAGER_ROLES };
