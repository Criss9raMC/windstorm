const db = require('./_lib/db');
const { getSession } = require('./_lib/session');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'metodo_no_permitido' });
        return;
    }

    const session = await getSession(req);
    if (!session) {
        res.status(401).json({ error: 'no_autenticado' });
        return;
    }

    let body = '';
    for await (const chunk of req) body += chunk;
    let data;
    try {
        data = JSON.parse(body || '{}');
    } catch {
        res.status(400).json({ error: 'json_invalido' });
        return;
    }

    const noteId = Number(data.noteId);
    if (!noteId) {
        res.status(400).json({ error: 'falta_note_id' });
        return;
    }

    await db.query(
        `insert into note_reads (note_id, discord_id, username)
         values ($1, $2, $3)
         on conflict (note_id, discord_id) do nothing`,
        [noteId, session.discord_id, session.username]
    );

    res.status(200).json({ ok: true });
};
