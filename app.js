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

    const form = document.getElementById('commandeForm');
    if (!form) return;

    const TOKEN = window.TOKEN || '';
    const CHANNEL = window.CHANNEL || '';

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const checkedMethods = form.querySelectorAll('input[name="contact_method"]:checked');
        if (checkedMethods.length === 0) {
            alert('Veuillez sélectionner au moins un moyen de contact.');
            return;
        }

        if (!TOKEN || !CHANNEL) {
            alert('Le token ou le channel Discord n\'est pas configuré.');
            return;
        }

        const typeProjet = form.querySelector('input[name="type_projet"]:checked')?.value || 'Non précisé';
        const budget = form.querySelector('#budget')?.value || 'Non précisé';
        const telephone = form.querySelector('#telephone')?.value || 'Non précisé';
        const email = form.querySelector('#email')?.value || 'Non précisé';
        const discord = form.querySelector('#discord')?.value || 'Non précisé';
        const contactMethods = Array.from(checkedMethods).map(input => input.value).join(', ');

        const embed = {
            title: 'Nouvelle commande',
            color: 3447003,
            fields: [
                { name: 'Type de projet', value: typeProjet, inline: false },
                { name: 'Budget', value: budget, inline: false },
                { name: 'Moyens de contact', value: contactMethods, inline: false },
                { name: 'Téléphone', value: telephone, inline: false },
                { name: 'Email', value: email, inline: false },
                { name: 'Discord', value: discord, inline: false }
            ],
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Erreur lors de l\'envoi au channel Discord');
            }

            alert('Demande envoyée avec succès !');
            form.reset();
        } catch (error) {
            console.error(error);
            alert('Impossible d\'envoyer la demande. Vérifiez le token, le channel et la configuration.');
        }
    });
});