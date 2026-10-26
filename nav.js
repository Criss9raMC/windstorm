// Menú de hamburguesa, solo activo visualmente en móvil (ver home.css).
(function () {
    var nav = document.querySelector('.nav');
    var burger = document.querySelector('.nav-burger');
    if (!nav || !burger) return;

    function cerrar() { nav.classList.remove('is-open'); }

    burger.addEventListener('click', function () {
        nav.classList.toggle('is-open');
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
})();
