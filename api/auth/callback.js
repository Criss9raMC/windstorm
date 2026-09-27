const { parseCookies, setCookie, clearCookie } = require('../_lib/cookies');
const { resolveRoles } = require('../_lib/roles');
const { createSession, COOKIE_NAME, SESSION_DAYS } = require('../_lib/session');

function redirectToStaff(res, query) {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    res.writeHead(302, { Location: `/staff/${qs}` });
    res.end();
}

module.exports = async (req, res) => {
    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const cookies = parseCookies(req);

        clearCookie(res, 'windstorm_oauth_state');

        if (!code || !state || state !== cookies.windstorm_oauth_state) {
            return redirectToStaff(res, { error: 'estado_invalido' });
        }

        const redirectUri = `https://${req.headers.host}/api/auth/callback`;

        // 1. Cambiar el código por un token de acceso
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        if (!tokenRes.ok) return redirectToStaff(res, { error: 'token' });
        const token = await tokenRes.json();

        // 2. Datos básicos del usuario
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!userRes.ok) return redirectToStaff(res, { error: 'usuario' });
        const user = await userRes.json();

        // 3. Su membresía (y roles) en el servidor de WindStorm
        const memberRes = await fetch(
            `https://discord.com/api/users/@me/guilds/${process.env.DISCORD_GUILD_ID}/member`,
            { headers: { Authorization: `Bearer ${token.access_token}` } }
        );

        if (memberRes.status === 404) {
            // Tiene cuenta de Discord pero no está en el servidor de WindStorm
            return redirectToStaff(res, { error: 'no_esta_en_el_server' });
        }
        if (!memberRes.ok) return redirectToStaff(res, { error: 'miembro' });

        const member = await memberRes.json();
        const resolved = resolveRoles(member.roles || []);

        if (!resolved) {
            // Está en el servidor, pero no tiene ninguno de los roles de staff
            return redirectToStaff(res, { error: 'sin_rol' });
        }

        const avatar = user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
            : null;

        const session = await createSession({
            discordId: user.id,
            username: user.username,
            avatar,
            roleKey: resolved.primary.key,
            roleLabel: resolved.primary.label,
            roles: resolved.allKeys,
        });

        setCookie(res, COOKIE_NAME, session.id, { maxAge: SESSION_DAYS * 24 * 60 * 60 });

        return redirectToStaff(res);
    } catch (err) {
        console.error('Error en /api/auth/callback:', err);
        return redirectToStaff(res, { error: 'inesperado' });
    }
};
