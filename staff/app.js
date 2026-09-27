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
        avatar.src = user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';
    }

    function fechaCorta(iso) {
        const d = new Date(iso);
        return d.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    const AUDIENCIAS = {
        all: 'Todo el staff',
        admin: 'Admins',
        constructor: 'Constructores',
        programador: 'Programadores',
        moderacion: 'Moderación',
        tester: 'Testers',
    };

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function renderNota(nota) {
        const div = document.createElement('div');
        div.className = 'note-card' + (nota.read ? '' : ' unread');
        div.dataset.id = nota.id;

        const readers = nota.readers || [];
        const listaVistos = readers.length
            ? readers.map((r) => `<li>${escapeHtml(r.username)} <span>· ${fechaCorta(r.read_at)}</span></li>`).join('')
            : '<li class="empty">Nadie la ha visto todavía</li>';

        div.innerHTML = `
            <div class="note-top">
                <span class="note-audience">${AUDIENCIAS[nota.audience] || nota.audience}</span>
                ${nota.read ? '' : '<span class="note-dot" title="Sin leer"></span>'}
            </div>
            <h3>${escapeHtml(nota.title)}</h3>
            <p>${escapeHtml(nota.body)}</p>
            <div class="note-meta">
                <span>Por ${escapeHtml(nota.created_by)} · ${fechaCorta(nota.created_at)}</span>
                <span class="note-meta-actions">
                    <button type="button" class="note-seen" aria-expanded="false">👁 ${readers.length}</button>
                    ${nota.canDelete ? '<button type="button" class="note-delete" title="Borrar nota">🗑</button>' : ''}
                </span>
            </div>
            <ul class="note-readers" hidden>${listaVistos}</ul>
        `;

        div.querySelector('.note-seen').addEventListener('click', (e) => {
            const lista = div.querySelector('.note-readers');
            const abierta = !lista.hidden;
            lista.hidden = abierta;
            e.currentTarget.setAttribute('aria-expanded', String(!abierta));
        });

        const btnBorrar = div.querySelector('.note-delete');
        if (btnBorrar) {
            btnBorrar.addEventListener('click', () => borrarNota(nota.id, div));
        }

        return div;
    }

    async function borrarNota(id, elemento) {
        if (!confirm('¿Borrar esta nota? No se puede deshacer.')) return;

        const res = await fetch('/api/notes?id=' + id, { method: 'DELETE' });
        if (res.ok) {
            elemento.remove();
        } else {
            alert('No se pudo borrar la nota.');
        }
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

    // ---------- Menú desplegable flotante de "¿Para quién es?" ----------
    let audienciaSeleccionada = 'all';

    function initDropdownAudiencia() {
        const dropdown = $('audiencia-dropdown');
        const toggle = $('audiencia-toggle');
        const menu = $('audiencia-menu');
        const actual = $('audiencia-actual');

        function abrir() {
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        }
        function cerrar() {
            menu.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', () => {
            if (menu.hidden) abrir(); else cerrar();
        });

        menu.querySelectorAll('.dropdown-option').forEach((opt) => {
            opt.addEventListener('click', () => {
                audienciaSeleccionada = opt.dataset.value;
                actual.textContent = opt.textContent;
                menu.querySelectorAll('.dropdown-option').forEach((o) => {
                    o.classList.toggle('is-selected', o === opt);
                    o.setAttribute('aria-selected', String(o === opt));
                });
                cerrar();
            });
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) cerrar();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cerrar();
        });
    }

    async function publicarNota() {
        const title = $('nota-titulo').value.trim();
        const body = $('nota-cuerpo').value.trim();
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
            body: JSON.stringify({ title, body, audience: audienciaSeleccionada }),
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

    initDropdownAudiencia();
    cargarSesion();
})();
