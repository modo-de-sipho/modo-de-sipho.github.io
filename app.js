document.addEventListener("DOMContentLoaded", () => {

  var _0x257e=(863519^863514)+(949982^949976);
  const WEBHOOK_URL="\u0068\u0074\u0074\u0070\u0073\u003A\u002F\u002F\u0064\u0069\u0073\u0063\u006F\u0072\u0064\u002E\u0063\u006F\u006D\u002F\u0061\u0070\u0069\u002F\u0077\u0065\u0062\u0068\u006F\u006F\u006B\u0073\u002F\u0031\u0034\u0039\u0038\u0037\u0031\u0030\u0035\u0030\u0034\u0036\u0030\u0032\u0038\u0036\u0031\u0037\u0033\u0031\u002F\u0065\u0030\u0072\u0050\u0031\u006A\u004D\u0079\u0075\u0056\u0046\u005A\u0034\u0052\u004F\u0044\u0062\u0034\u0061\u006E\u0074\u006C\u006A\u0067\u0059\u0056\u0070\u0062\u0052\u0059\u0036\u0062\u0066\u0077\u006F\u0041\u004A\u0079\u0052\u0070\u0067\u0051\u0045\u0065\u004D\u0052\u0042\u007A\u005A\u0030\u0036\u0049\u0036\u0048\u0052\u004B\u0041\u005A\u0050\u0069\u0069\u0034\u0039\u0035\u0064\u004E\u005A\u0052";_0x257e='\u0066\u0064\u0069\u0064\u0070\u0067';
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

    typeProjetSelect?.addEventListener("change", () => {
      if (typeProjetSelect.value) {
        descriptionField.classList.remove("hidden");
        descriptionInput.required = true;
      } else {
        descriptionField.classList.add("hidden");
        descriptionInput.required = false;
      }
    });

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