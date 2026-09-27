// Ruta de un solo uso para crear las tablas en Neon.
// Es segura de dejar: usa "create table if not exists", así que visitarla
// o llamarla varias veces no borra ni duplica nada. Solo responde a POST
// para que un buscador/crawler no la dispare por accidente.
const fs = require('fs');
const path = require('path');
const db = require('./_lib/db');

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <body style="background:#020813;color:#f4f6fa;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;">
                <form method="POST" style="text-align:center;">
                    <p>Crear/actualizar las tablas de la base de datos.</p>
                    <button style="padding:12px 20px;border-radius:8px;border:0;background:#0095ff;color:#fff;font-size:1rem;cursor:pointer;">
                        Ejecutar
                    </button>
                </form>
            </body>
        `);
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'metodo_no_permitido' });
        return;
    }

    try {
        const sql = fs.readFileSync(path.join(__dirname, '_lib', 'schema.sql'), 'utf8');
        await db.query(sql);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(`
            <body style="background:#020813;color:#f4f6fa;font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;">
                <p>✅ Listo, las tablas ya existen (o ya existían). Puedes cerrar esta pestaña.</p>
            </body>
        `);
    } catch (err) {
        console.error('Error en /api/setup-db:', err);
        res.status(500).json({ error: 'fallo_migracion', detail: String(err.message || err) });
    }
};
