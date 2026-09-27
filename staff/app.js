(function () {
    const $ = (id) => document.getElementById(id);
    const pantallas = ['pantalla-cargando', 'pantalla-login', 'pantalla-panel'];
    function mostrar(id) {
        pantallas.forEach((p) => { $(p).hidden = p !== id; });
    }

    const ERRORES = {
        estado_invalido: 'Algo no cuadró con Discord, intenta iniciar sesión de nuevo.',
        token: 'Discord no aceptó la solicitud, intenta de nuevo.',
        usuario: 'No se pudo leer tu cuenta de Discord.',
        miembro: 'No se pudo comprobar tu membresía del servidor.',
        no_esta_en_el_server: 'Tu cuenta de Discord no está en el servidor de WindStorm.',
        sin_rol: 'Tu cuenta está en el servidor, pero no tienes ningún rol de staff asignado.',
        inesperado: 'Algo salió mal. Intenta de nuevo en un momento.',
    };

    async function cargarSesion() {
        const params = new URLSearchParams(location.search);
        const error = params.get('error');

        const res = await fetch('/api/session');
        const data = await res.json();

        if (!data.authenticated) {
            mostrar('pantalla-login');
            if (error) {
                const el = $('login-error');
                el.textContent = ERRORES[error] || ERRORES.inesperado;
                el.hidden = false;
            }
            return;
        }

        mostrar('pantalla-panel');
        pintarUsuario(data.user);
        cargarNotas();
    }

    function pintarUsuario(user) {
        $('user-nombre').textContent = user.username;
        const badge = $('badge-dinamico');
        badge.textContent = user.roleLabel;

        const avatar = $('user-avatar');
        if (user.avatar) {
            avatar.src = user.avatar;
        } else {
            avatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        }
    }

    function fechaCorta(iso) {
        const d = new Date(iso);
        return d.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    const AUDIENCIAS = {
        all: 'Todo el staff',
        constructor: 'Constructores',
        programador: 'Programadores',
        moderacion: 'Moderación',
        tester: 'Testers',
    };

    function renderNota(nota) {
        const div = document.createElement('div');
        div.className = 'note-card' + (nota.read ? '' : ' unread');
        div.dataset.id = nota.id;

        const vistoPor = (nota.readers || []).map((r) => r.username).join(', ') || 'nadie todavía';

        div.innerHTML = `
            <div class="note-top">
                <span class="note-audience">${AUDIENCIAS[nota.audience] || nota.audience}</span>
                ${nota.read ? '' : '<span class="note-dot" title="Sin leer"></span>'}
            </div>
            <h3>${escapeHtml(nota.title)}</h3>
            <p>${escapeHtml(nota.body)}</p>
            <div class="note-meta">
                <span>Por ${escapeHtml(nota.created_by)} · ${fechaCorta(nota.created_at)}</span>
                <span class="note-seen" title="Quién la ha visto: ${escapeHtml(vistoPor)}">👁 ${(nota.readers || []).length}</span>
            </div>
        `;
        return div;
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    async function cargarNotas() {
        const cont = $('lista-notas');
        cont.textContent = 'Cargando notas…';

        const res = await fetch('/api/notes');
        if (!res.ok) {
            cont.textContent = 'No se pudieron cargar las notas.';
            return;
        }
        const data = await res.json();

        cont.innerHTML = '';
        if (data.notes.length === 0) {
            cont.innerHTML = '<p class="hint">Todavía no hay notas.</p>';
            return;
        }

        data.notes.forEach((nota) => cont.appendChild(renderNota(nota)));

        // Marcar como vistas las que aparecen en pantalla y aún no se habían visto
        cont.querySelectorAll('.note-card.unread').forEach((el) => {
            const id = Number(el.dataset.id);
            fetch('/api/notes-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteId: id }),
            }).then(() => {
                el.classList.remove('unread');
                const dot = el.querySelector('.note-dot');
                if (dot) dot.remove();
            });
        });
    }

    async function publicarNota() {
        const title = $('nota-titulo').value.trim();
        const body = $('nota-cuerpo').value.trim();
        const audience = $('nota-audiencia').value;
        const errorEl = $('nota-error');
        errorEl.hidden = true;

        if (!title || !body) {
            errorEl.textContent = 'Escribe un título y el contenido de la nota.';
            errorEl.hidden = false;
            return;
        }

        const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, audience }),
        });

        if (!res.ok) {
            errorEl.textContent = 'No se pudo publicar la nota, intenta de nuevo.';
            errorEl.hidden = false;
            return;
        }

        $('nota-titulo').value = '';
        $('nota-cuerpo').value = '';
        cargarNotas();
    }

    $('btn-publicar').addEventListener('click', publicarNota);
    $('btn-salir').addEventListener('click', () => { location.href = '/api/auth/logout'; });

    cargarSesion();
})();
