document.addEventListener('DOMContentLoaded', () => {
    // --- Animation au défilement pour les cartes de service ---
    const animatedItems = document.querySelectorAll('.service-item');

    if (animatedItems.length === 0) return;

    const observerOptions = {
        root: null, // par rapport au viewport
        rootMargin: '0px',
        threshold: 0.1 // se déclenche quand 10% de l'élément est visible
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // On arrête d'observer une fois l'animation lancée
            }
        });
    }, observerOptions);

    animatedItems.forEach((item, index) => {
        item.classList.add('fade-in-up');
        item.style.transitionDelay = `${index * 100}ms`; // Applique un délai échelonné
        animationObserver.observe(item);
    });
});