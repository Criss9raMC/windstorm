# Backend del panel de staff

## Qué se agregó
- `api/` — funciones que corren en el servidor (login con Discord, sesión, notas)
- `staff/app.js` — la lógica nueva del panel (ya no usa contraseñas)
- `package.json` — le dice a Vercel que instale el paquete `pg` (Postgres)

## Pasos para activarlo
1. Sube TODO el contenido de este zip a tu repositorio de GitHub (respeta las carpetas, especialmente `api/`).
2. Espera a que Vercel termine de desplegar (lo hace solo en cuanto detecta el push).
3. Entra una sola vez a `https://windstorm-mc.vercel.app/api/setup-db` y dale click a "Ejecutar".
   Esto crea las tablas en tu base de datos. Es seguro visitarla más de una vez.
4. Ve a `https://windstorm-mc.vercel.app/staff/` y entra con tu cuenta de Discord.

## Cómo funciona
- Alguien entra a `/staff/` → si no hay sesión, ve un botón "Iniciar sesión con Discord".
- Al iniciar sesión, el sitio comprueba si esa persona está en tu servidor de Discord y
  qué rol de staff tiene (usando los IDs de rol en `api/_lib/roles.js`).
- Si no tiene ningún rol de staff, no entra (se le muestra un aviso).
- Si tiene rol, ve el panel: puede leer notas (se marcan como "vistas" solo al abrirlas)
  y publicar notas nuevas para todo el staff o solo para un rol.
- Cada nota muestra cuántas personas la han visto.

## Si algún día cambian los roles en Discord
Edita `api/_lib/roles.js` y ajusta los IDs. No hay que tocar nada más.
