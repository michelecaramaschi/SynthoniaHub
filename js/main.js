/*
 * Comportamenti condivisi: menu mobile, popolamento select location,
 * invio form preventivo verso WhatsApp (click-to-chat, nessun backend).
 */

const WHATSAPP_NUMBER = "393923250072"; // +39 392 325 0072, senza "+" per wa.me

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => links.classList.remove("open"));
  });
}

function populateLocationSelect() {
  const select = document.getElementById("quote-location");
  if (!select || typeof LOCATIONS === "undefined") return;

  LOCATIONS.forEach((loc) => {
    const option = document.createElement("option");
    option.value = loc.name;
    option.textContent = `${loc.name} (${loc.city})`;
    select.appendChild(option);
  });
}

function buildWhatsAppMessage(data) {
  const lines = [
    "Ciao Synthonia! Vorrei richiedere un preventivo per un evento.",
    "",
    `Nome: ${data.name}`,
    `Telefono: ${data.phone}`,
  ];

  if (data.email) lines.push(`Email: ${data.email}`);
  lines.push(`Tipo di evento: ${data.eventType}`);
  if (data.eventDate) lines.push(`Data evento: ${data.eventDate}`);
  if (data.guests) lines.push(`Numero invitati: ${data.guests}`);
  if (data.location) lines.push(`Location di interesse: ${data.location}`);
  if (data.message) lines.push("", `Dettagli: ${data.message}`);

  return lines.join("\n");
}

function initQuoteForm() {
  const form = document.getElementById("quote-form");
  const status = document.getElementById("quote-status");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const eventType = form.eventType.value;

    if (!name || !phone || !eventType) {
      status.textContent = "Compila i campi obbligatori (nome, telefono, tipo di evento).";
      status.className = "form-status error";
      return;
    }

    const data = {
      name,
      phone,
      email: form.email.value.trim(),
      eventType,
      eventDate: form.eventDate.value,
      guests: form.guests.value.trim(),
      location: form.location.value,
      message: form.message.value.trim(),
    };

    const text = buildWhatsAppMessage(data);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

    status.textContent = "Apertura di WhatsApp in corso...";
    status.className = "form-status success";

    window.open(url, "_blank", "noopener");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  populateLocationSelect();
  initQuoteForm();
});
