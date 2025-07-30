document.addEventListener('DOMContentLoaded', () => {
    // --- Gestion du menu de navigation mobile ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            // Correction : la classe CSS est 'is-active', pas 'active'
            navMenu.classList.toggle('is-active');
            const isExpanded = navMenu.classList.contains('is-active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    // --- Indicateur de page active dans la navigation ---
    // Centralisation de la logique pour éviter la duplication dans les fichiers HTML.
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.main-nav .nav-link');

    navLinks.forEach(link => {
        // On s'assure de retirer la classe active de tous les liens d'abord
        link.classList.remove('active');
        link.removeAttribute('aria-current');

        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
});