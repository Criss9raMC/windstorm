-- Esquema de la base de datos del panel de staff (Postgres / Neon)
-- Solo se necesita correr esto UNA VEZ. Ver README-BACKEND.md para instrucciones.

create table if not exists sessions (
    id          text primary key,          -- id aleatorio, también es el valor de la cookie
    discord_id  text not null,
    username    text not null,
    avatar      text,
    role_key    text not null,             -- rol "principal" para mostrar (constructor, programador, moderacion, tester)
    role_label  text not null,             -- nombre bonito del rol principal
    roles       jsonb not null default '[]'::jsonb, -- todos los roles de staff que tiene (para ver notas de varias áreas)
    created_at  timestamptz not null default now(),
    expires_at  timestamptz not null
);

create table if not exists notes (
    id             serial primary key,
    title          text not null,
    body           text not null,
    audience       text not null default 'all', -- 'all' | 'admin' | 'constructor' | 'programador' | 'moderacion' | 'tester'
    created_by     text not null,               -- username de Discord de quien la escribió
    created_by_id  text,                        -- discord_id del autor (para saber si puede borrarla)
    created_at     timestamptz not null default now()
);

-- Migración: si la tabla ya existía de antes, le agrega la columna nueva.
alter table notes add column if not exists created_by_id text;

create table if not exists note_reads (
    note_id     integer not null references notes(id) on delete cascade,
    discord_id  text not null,
    username    text not null,
    read_at     timestamptz not null default now(),
    primary key (note_id, discord_id)
);

create index if not exists sessions_expires_idx on sessions (expires_at);
