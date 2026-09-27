const db = require('./_lib/db');
const { getSession } = require('./_lib/session');

module.exports = async (req, res) => {
    const session = await getSession(req);
    if (!session) {
        res.status(401).json({ error: 'no_autenticado' });
        return;
    }

    if (req.method === 'GET') {
        const roles = Array.isArray(session.roles) ? session.roles : [];
        const { rows } = await db.query(
            `select n.id, n.title, n.body, n.audience, n.created_by, n.created_at,
                    exists(
                        select 1 from note_reads r
                        where r.note_id = n.id and r.discord_id = $1
                    ) as read,
                    coalesce(
                        (select json_agg(json_build_object('username', r.username, 'read_at', r.read_at) order by r.read_at)
                         from note_reads r where r.note_id = n.id),
                        '[]'::json
                    ) as readers
             from notes n
             where n.audience = 'all' or n.audience = any($2::text[])
             order by n.created_at desc`,
            [session.discord_id, roles]
        );
        res.status(200).json({ notes: rows });
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        for await (const chunk of req) body += chunk;
        let data;
        try {
            data = JSON.parse(body || '{}');
        } catch {
            res.status(400).json({ error: 'json_invalido' });
            return;
        }

        const title = (data.title || '').trim();
        const text = (data.body || '').trim();
        const audience = ['all', 'constructor', 'programador', 'moderacion', 'tester'].includes(data.audience)
            ? data.audience
            : 'all';

        if (!title || !text) {
            res.status(400).json({ error: 'faltan_campos' });
            return;
        }

        const { rows } = await db.query(
            `insert into notes (title, body, audience, created_by)
             values ($1, $2, $3, $4)
             returning id, title, body, audience, created_by, created_at`,
            [title, text, audience, session.username]
        );

        const note = rows[0];

        // El autor marca su propia nota como vista automáticamente
        await db.query(
            `insert into note_reads (note_id, discord_id, username)
             values ($1, $2, $3)
             on conflict (note_id, discord_id) do nothing`,
            [note.id, session.discord_id, session.username]
        );

        res.status(201).json({ note: { ...note, read: true, readers: [{ username: session.username, read_at: new Date() }] } });
        return;
    }

    res.status(405).json({ error: 'metodo_no_permitido' });
};
