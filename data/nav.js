// Menú de hamburguesa, solo activo visualmente en móvil (ver home.css).
(function () {
    function animarLetras() {
        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        document.querySelectorAll('main h1, main h2, main h3').forEach(function (heading) {
            var accessibleText = heading.textContent.replace(/\s+/g, ' ').trim();
            if (!accessibleText) return;

            var walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
            var textNodes = [];
            while (walker.nextNode()) textNodes.push(walker.currentNode);

            var letterIndex = 0;
            heading.setAttribute('aria-label', accessibleText);
            textNodes.forEach(function (textNode) {
                var fragment = document.createDocumentFragment();
                var tokens = textNode.nodeValue.match(/\s+|\S+/g) || [];
                tokens.forEach(function (token) {
                    if (/^\s+$/.test(token)) {
                        fragment.appendChild(document.createTextNode(token));
                        return;
                    }

                    var word = document.createElement('span');
                    word.className = 'letter-word';
                    Array.from(token).forEach(function (character) {
                        var letter = document.createElement('span');
                        letter.className = 'letter-char';
                        letter.setAttribute('aria-hidden', 'true');
                        letter.style.setProperty('--letter-index', letterIndex++);
                        letter.textContent = character;
                        word.appendChild(letter);
                    });
                    fragment.appendChild(word);
                });
                textNode.parentNode.replaceChild(fragment, textNode);
            });

            if (letterIndex) heading.classList.add('letters-animating');
        });
    }

    var loaderStarted = window.__windstormLoadStarted;
    if (typeof loaderStarted === 'number') {
        function ocultarPantallaDeCarga() {
            document.documentElement.classList.remove('is-loading');
            window.clearTimeout(window.__windstormLoaderTimeout);
        }

        function terminarCargaInicial() {
            var remaining = Math.max(0, 500 - (Date.now() - loaderStarted));
            window.setTimeout(function () {
                ocultarPantallaDeCarga();
                animarLetras();
            }, remaining);
        }

        if (document.readyState === 'complete') {
            terminarCargaInicial();
        } else {
            window.addEventListener('load', terminarCargaInicial, { once: true });
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
