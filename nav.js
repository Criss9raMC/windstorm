// Menú de hamburguesa, solo activo visualmente en móvil (ver home.css).
(function () {
    var loaderStarted = window.__windstormLoadStarted;
    if (typeof loaderStarted === 'number') {
        function ocultarPantallaDeCarga() {
            document.documentElement.classList.remove('is-loading');
            window.clearTimeout(window.__windstormLoaderTimeout);
        }

        function terminarCargaInicial() {
            var remaining = Math.max(0, 500 - (Date.now() - loaderStarted));
            window.setTimeout(ocultarPantallaDeCarga, remaining);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', terminarCargaInicial, { once: true });
        } else {
            terminarCargaInicial();
        }
    }

    var nav = document.querySelector('.nav');
    var burger = document.querySelector('.nav-burger');

    if (nav && burger) {
        function actualizarEstado() {
            burger.setAttribute('aria-expanded', nav.classList.contains('is-open') ? 'true' : 'false');
        }

        function cerrar() {
            nav.classList.remove('is-open');
            actualizarEstado();
        }

        burger.addEventListener('click', function () {
            nav.classList.toggle('is-open');
            actualizarEstado();
        });

        document.querySelectorAll('.nav-mobile-panel a').forEach(function (a) {
            a.addEventListener('click', cerrar);
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 720) cerrar();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrar();
        });
    }

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var revealTargets = document.querySelectorAll(
        '.discord-card, .social-card, .section h2, .section > .lead, .details, .embed-block, .colab-card, .staff-card, .not-found-inner, .footer'
    );
    if (!revealTargets.length) return;

    var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    revealTargets.forEach(function (target) {
        target.classList.add('motion-reveal');
        revealObserver.observe(target);
    });
})();
