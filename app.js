document.addEventListener('DOMContentLoaded', () => {
    // Forcer le scroll en haut au chargement de la page
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                const fill = entry.target.querySelector('.fill');
                setTimeout(() => {
                    fill.style.width = fill.dataset.percent + '%';
                }, 500); // Délai pour laisser l'animation de glissement se terminer
            }
        });
    }, { threshold: 0.5 }); // Déclenche quand 50% de la barre est visible

    document.querySelectorAll('.language-bar').forEach(bar => {
        observer.observe(bar);
    });
});