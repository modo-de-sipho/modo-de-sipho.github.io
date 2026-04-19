document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                const fill = entry.target.querySelector('.fill');
                setTimeout(() => {
                    fill.style.width = fill.dataset.percent + '%';
                }, 500);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.language-bar').forEach(bar => {
        observer.observe(bar);
    });

    const form = document.getElementById('commandeForm');
    if (!form) return;

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

    const contactMethodLabels = {
        telephone: 'Téléphone',
        email: 'Email',
        discord: 'Discord'
    };

    const updateContactFields = () => {
        const selected = contactMethodSelect?.value;
        Object.keys(contactFields).forEach(key => {
            const field = contactFields[key];
            const input = contactInputs[key];
            if (!field || !input) return;
            if (selected === key) {
                field.classList.remove('hidden');
                input.required = true;
            } else {
                field.classList.add('hidden');
                input.required = false;
            }
        });
    };

    contactMethodSelect?.addEventListener('change', updateContactFields);
    updateContactFields();

    const COOLDOWN_MS = 60000;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const lastSubmit = localStorage.getItem('lastSubmit');
        if (lastSubmit && Date.now() - parseInt(lastSubmit) < COOLDOWN_MS) {
            const secondsLeft = Math.ceil((COOLDOWN_MS - (Date.now() - parseInt(lastSubmit))) / 1000);
            alert(`Veuillez attendre ${secondsLeft} secondes avant de renvoyer.`);
            return;
        }

        const contactMethod = form.querySelector('#contact_method')?.value;
        if (!contactMethod) {
            alert('Veuillez sélectionner un moyen de contact.');
            return;
        }

        try {
            const response = await fetch('https://parseapi.back4app.com/functions/commande', {
                method: 'POST',
                headers: {
                    'X-Parse-Application-Id': 'd7KtbyR2bRVBfCzQPBzoyGxfMzV68kPdTEAy6oP9',
                    'X-Parse-Javascript-Key': 'DNLWYl7nkYndrCl4ivfO8CmXGidDTcQQbkXS16tQ',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    typeProjet:    form.querySelector('#type_projet')?.value,
                    budget:        form.querySelector('#budget')?.value,
                    contactMethod: contactMethodLabels[contactMethod],
                    contactValue:  form.querySelector(`#${contactMethod}`)?.value
                })
            });

            const data = await response.json();
            console.log('Réponse Back4App :', data);

            if (!response.ok) throw new Error(data.error || 'Erreur serveur');

            localStorage.setItem('lastSubmit', Date.now().toString());
            alert('Demande envoyée avec succès !');
            form.reset();
            updateContactFields();
        } catch (error) {
            console.error('Erreur :', error);
            alert('Impossible d\'envoyer la demande. Veuillez réessayer.');
        }
    });
});