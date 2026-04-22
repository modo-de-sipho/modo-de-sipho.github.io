document.addEventListener("DOMContentLoaded", () => {

  // ── Formulaire de commande ──────────────────────────────────────────
  const WEBHOOK_URL = "https://discord.com/api/webhooks/1496495823939178707/x_y5Lv_DVNkyrKYZ3HjL4p_Cf0DSbVJPqpdKmy6vBKjGP8Q2YcizFRbieaM13k4wJ_MW";
  const COOLDOWN_MS = 8464;

  const form = document.getElementById("commandeForm");

  if (form) {
    const typeProjetSelect = form.querySelector("#type_projet");
    const descriptionField = form.querySelector("#description-field");
    const descriptionInput = form.querySelector("#description");
    const contactMethodSelect = form.querySelector("#contact_method");

    const contactFields = {
      telephone: form.querySelector(".contact-telephone"),
      email: form.querySelector(".contact-email"),
      discord: form.querySelector(".contact-discord"),
    };

    const contactInputs = {
      telephone: form.querySelector("#telephone"),
      email: form.querySelector("#email"),
      discord: form.querySelector("#discord"),
    };

    const contactMethodLabels = {
      telephone: "Téléphone",
      email: "Email",
      discord: "Discord",
    };

    // Affiche/cache la description selon le type de projet
    typeProjetSelect?.addEventListener("change", () => {
      if (typeProjetSelect.value) {
        descriptionField.classList.remove("hidden");
        descriptionInput.required = true;
      } else {
        descriptionField.classList.add("hidden");
        descriptionInput.required = false;
      }
    });

    // Affiche/cache le champ de contact selon la méthode choisie
    const updateContactFields = () => {
      const selected = contactMethodSelect?.value;
      Object.keys(contactFields).forEach((key) => {
        const field = contactFields[key];
        const input = contactInputs[key];
        if (!field || !input) return;
        if (selected === key) {
          field.classList.remove("hidden");
          input.required = true;
        } else {
          field.classList.add("hidden");
          input.required = false;
        }
      });
    };

    contactMethodSelect?.addEventListener("change", updateContactFields);
    updateContactFields();

    // Soumission du formulaire → webhook Discord
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const lastSubmit = localStorage.getItem("lastSubmit");
      if (lastSubmit && Date.now() - parseInt(lastSubmit) < COOLDOWN_MS) {
        const secondsLeft = Math.ceil(
          (COOLDOWN_MS - (Date.now() - parseInt(lastSubmit))) / 1000
        );
        alert(`Veuillez attendre ${secondsLeft} secondes avant de renvoyer.`);
        return;
      }

      const contactMethod = contactMethodSelect?.value;
      if (!contactMethod) {
        alert("Veuillez sélectionner un moyen de contact.");
        return;
      }

      const typeProjet = form.querySelector("#type_projet")?.value;
      const description = form.querySelector("#description")?.value;
      const budget = form.querySelector("#budget")?.value;
      const contactLabel = contactMethodLabels[contactMethod];
      const contactValue = form.querySelector(`#${contactMethod}`)?.value;

      const embed = {
        title: "📋 Nouvelle commande",
        color: 0x5865f2,
        fields: [
          { name: "Type de projet", value: typeProjet || "—", inline: true },
          { name: "Budget", value: budget || "—", inline: true },
          { name: "Contact", value: `${contactLabel} : ${contactValue}`, inline: false },
          { name: "Description", value: description || "—", inline: false },
        ],
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embeds: [embed] }),
        });

        if (!response.ok) throw new Error(`Erreur webhook : ${response.status}`);

        localStorage.setItem("lastSubmit", Date.now().toString());
        alert("Demande envoyée avec succès !");
        form.reset();
        descriptionField.classList.add("hidden");
        descriptionInput.required = false;
        updateContactFields();
      } catch (error) {
        console.error("Erreur :", error);
        alert("Impossible d'envoyer la demande. Veuillez réessayer.");
      }
    });
  }

  // ── Animation des barres de langages ───────────────────────────────
  const bars = document.querySelectorAll(".language-bar");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
        }
      });
    },
    { threshold: 0.2 }
  );

  bars.forEach((bar) => observer.observe(bar));

});