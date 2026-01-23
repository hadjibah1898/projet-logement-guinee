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
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    const dropdownAnnonces = ['a-vendre.html', 'louyer.html', 'colocation.html'];

    navLinks.forEach(link => {
        // On s'assure de retirer la classe active de tous les liens d'abord
        link.classList.remove('active');
        link.removeAttribute('aria-current');

        const linkHref = link.getAttribute('href');

        if (linkHref === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });

    // Gérer le cas où une des pages du dropdown est active
    if (dropdownAnnonces.includes(currentPage)) {
        const annoncesBtn = document.querySelector('.dropdown .dropbtn');
        if (annoncesBtn) annoncesBtn.classList.add('active');
    }
});