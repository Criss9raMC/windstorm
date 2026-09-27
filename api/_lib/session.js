const crypto = require('crypto');
const db = require('./db');
const { parseCookies } = require('./cookies');

const COOKIE_NAME = 'windstorm_session';
const SESSION_DAYS = 7;

function randomId() {
    return crypto.randomBytes(24).toString('hex');
}

async function createSession({ discordId, username, avatar, roleKey, roleLabel, roles }) {
    const id = randomId();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await db.query(
        `insert into sessions (id, discord_id, username, avatar, role_key, role_label, roles, expires_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, discordId, username, avatar, roleKey, roleLabel, JSON.stringify(roles), expiresAt]
    );
    return { id, expiresAt };
}

/** Lee la cookie de la petición y devuelve la sesión (o null). */
async function getSession(req) {
    const cookies = parseCookies(req);
    const id = cookies[COOKIE_NAME];
    if (!id) return null;

    const { rows } = await db.query(
        `select * from sessions where id = $1 and expires_at > now() limit 1`,
        [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
}

async function destroySession(req) {
    const cookies = parseCookies(req);
    const id = cookies[COOKIE_NAME];
    if (!id) return;
    await db.query(`delete from sessions where id = $1`, [id]);
}

module.exports = { COOKIE_NAME, SESSION_DAYS, createSession, getSession, destroySession };
