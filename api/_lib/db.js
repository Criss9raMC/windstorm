// Conexión reutilizable a la base de datos (Neon Postgres).
// Vercel reutiliza la instancia de la función entre invocaciones "calientes",
// así que guardamos el Pool en una variable global para no abrir una
// conexión nueva en cada visita.
const { Pool } = require('pg');

let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 3,
        });
    }
    return pool;
}

async function query(text, params) {
    const client = getPool();
    return client.query(text, params);
}

module.exports = { query };
