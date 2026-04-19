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
    if (!form) {
        console.error('Erreur : Formulaire commandeForm non trouvé dans le DOM');
        return;
    }

    console.log('Formulaire de commande initialisé');

    const TOKEN = window.TOKEN || '';
    const CHANNEL = window.CHANNEL || '';

    if (!TOKEN) {
        console.error('Erreur : TOKEN Discord non défini (window.TOKEN)');
    }
    if (!CHANNEL) {
        console.error('Erreur : CHANNEL Discord non défini (window.CHANNEL)');
    }

    const contactMethodSelect = form.querySelector('#contact_method');
    const contactFields = {
        telephone: form.querySelector('.contact-telephone'),
        email: form.querySelector('.contact-email'),
        discord: form.querySelector('.contact-discord')
    };
    const contactInputs = {
        telephone: form.querySelector('#telephone'),
        email: form.querySelector('#email'),
        discord: form.querySelector('#discord')
    };

    // Vérifier si les éléments du DOM sont trouvés
    if (!contactMethodSelect) {
        console.error('Erreur : Sélecteur contact_method non trouvé');
    }
    Object.keys(contactFields).forEach(key => {
        if (!contactFields[key]) {
            console.error(`Erreur : Champ contact ${key} non trouvé`);
        }
        if (!contactInputs[key]) {
            console.error(`Erreur : Input contact ${key} non trouvé`);
        }
    });

    const updateContactFields = () => {
        const selected = contactMethodSelect?.value;
        console.log(`Mise à jour des champs de contact : ${selected}`);
        Object.keys(contactFields).forEach(key => {
            const field = contactFields[key];
            const input = contactInputs[key];
            if (!field || !input) return;
            if (selected === key) {
                field.classList.remove('hidden');
                input.required = true;
                console.log(`Champ ${key} affiché et requis`);
            } else {
                field.classList.add('hidden');
                input.required = false;
            }
        });
    };

    contactMethodSelect?.addEventListener('change', updateContactFields);
    updateContactFields();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Soumission du formulaire de commande');

        const contactMethod = form.querySelector('#contact_method')?.value;
        if (!contactMethod) {
            console.error('Erreur : Aucun moyen de contact sélectionné');
            alert('Veuillez sélectionner un moyen de contact.');
            return;
        }

        if (!TOKEN || !CHANNEL) {
            console.error('Erreur : TOKEN ou CHANNEL Discord manquant');
            alert('Le token ou le channel Discord n\'est pas configuré.');
            return;
        }

        const typeProjet = form.querySelector('#type_projet')?.value || 'Non précisé';
        const budget = form.querySelector('#budget')?.value || 'Non précisé';
        const telephone = contactMethod === 'telephone' ? form.querySelector('#telephone')?.value || 'Non précisé' : 'Non utilisé';
        const email = contactMethod === 'email' ? form.querySelector('#email')?.value || 'Non précisé' : 'Non utilisé';
        const discord = contactMethod === 'discord' ? form.querySelector('#discord')?.value || 'Non précisé' : 'Non utilisé';
        const contactMethodLabels = {
            telephone: 'Téléphone',
            email: 'Email',
            discord: 'Discord'
        };
        const contactMethods = contactMethodLabels[contactMethod] || contactMethod;

        console.log('Données collectées :', {
            typeProjet,
            budget,
            contactMethods,
            telephone,
            email,
            discord
        });

        const embed = {
            title: 'Nouvelle commande',
            color: 3447003,
            fields: [
                { name: 'Type de projet', value: typeProjet, inline: false },
                { name: 'Budget', value: budget, inline: false },
                { name: 'Moyen de contact', value: contactMethods, inline: false },
                { name: 'Téléphone', value: telephone, inline: false },
                { name: 'Email', value: email, inline: false },
                { name: 'Discord', value: discord, inline: false }
            ],
            timestamp: new Date().toISOString()
        };

        try {
            console.log('Envoi vers Discord...');
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
                console.error('Erreur HTTP Discord :', response.status, errorData);
                throw new Error(errorData.message || 'Erreur lors de l\'envoi au channel Discord');
            }

            console.log('Demande envoyée avec succès à Discord');
            alert('Demande envoyée avec succès !');
            form.reset();
            updateContactFields();
        } catch (error) {
            console.error('Erreur lors de l\'envoi Discord :', error);
            alert('Impossible d\'envoyer la demande. Vérifiez le token, le channel et la configuration.');
        }
    });
});