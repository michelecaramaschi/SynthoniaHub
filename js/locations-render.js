/*
 * Rendering di card location, gallerie ed eventi a partire da LOCATIONS
 * (definito in js/locations-data.js). Nessuna foto reale è ancora
 * disponibile: le immagini sono sostituite da riquadri sfumati con
 * etichetta testuale, pronti per essere rimpiazzati da <img> reali.
 */

const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #ff3ec8, #b445ff)",
  "linear-gradient(135deg, #b445ff, #29e0ff)",
  "linear-gradient(135deg, #29e0ff, #ff3ec8)",
];

function gradientFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % PLACEHOLDER_GRADIENTS.length;
  }
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length];
}

function renderEventRows(container, locations) {
  if (!container) return;
  container.innerHTML = "";

  const rows = locations
    .flatMap((loc) => loc.events.map((event) => ({ ...event, loc })))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  rows.forEach(({ name, loc }) => {
    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `
      <div class="event-row-info">
        <h3>${name}</h3>
        <div class="event-row-meta">
          <span>📍 ${loc.city}, ${loc.province}, ${loc.country}</span>
        </div>
      </div>
      <a class="btn btn-outline" href="location.html?slug=${encodeURIComponent(loc.slug)}">Ulteriori informazioni</a>
    `;
    container.appendChild(row);
  });
}

function renderLocationCards(container, locations) {
  if (!container) return;
  container.innerHTML = "";

  locations.forEach((loc) => {
    const card = document.createElement("a");
    card.className = "location-card";
    card.href = `location.html?slug=${encodeURIComponent(loc.slug)}`;

    const cover = document.createElement("div");
    cover.className = "location-card-cover";
    cover.style.background = gradientFor(loc.slug);
    cover.textContent = loc.name;

    const body = document.createElement("div");
    body.className = "location-card-body";
    body.innerHTML = `
      <span class="location-card-city">${loc.city}, ${loc.province}</span>
      <h3>${loc.name}</h3>
      <p>${loc.tagline}</p>
    `;

    card.append(cover, body);
    container.appendChild(card);
  });
}

function renderLocationDetail(location) {
  const heroCover = document.getElementById("location-cover");
  const breadcrumbName = document.getElementById("breadcrumb-name");
  const nameEl = document.getElementById("location-name");
  const taglineEl = document.getElementById("location-tagline");
  const descEl = document.getElementById("location-description");
  const cityEl = document.getElementById("meta-city");
  const capacityEl = document.getElementById("meta-capacity");
  const eventsCountEl = document.getElementById("meta-events-count");
  const eventsList = document.getElementById("events-list");
  const gallery = document.getElementById("gallery-grid");

  document.title = `${location.name} — Synthonia`;
  heroCover.style.background = gradientFor(location.slug);
  heroCover.textContent = location.name;
  breadcrumbName.textContent = location.name;
  nameEl.textContent = location.name;
  taglineEl.textContent = location.tagline;
  descEl.textContent = location.description;
  cityEl.textContent = `${location.city}, ${location.province}`;
  capacityEl.textContent = location.capacity;
  eventsCountEl.textContent = location.events.length;

  eventsList.innerHTML = "";
  if (location.events.length === 0) {
    eventsList.innerHTML = '<p class="empty-state">Nessun evento in programma al momento per questa location.</p>';
  } else {
    location.events.forEach((event) => {
      const item = document.createElement("article");
      item.className = "event-item";
      item.innerHTML = `
        <div>
          <h3>${event.name}</h3>
          <p>${event.description}</p>
        </div>
      `;
      eventsList.appendChild(item);
    });
  }

  gallery.innerHTML = "";
  if (location.photos.length === 0) {
    gallery.innerHTML = '<p class="empty-state">Galleria fotografica in arrivo.</p>';
  } else {
    location.photos.forEach((photo, index) => {
      const tile = document.createElement("div");
      tile.className = "gallery-photo";
      tile.style.background = gradientFor(`${location.slug}-${index}`);
      tile.textContent = photo.caption;
      gallery.appendChild(tile);
    });
  }
}

function initLocationsListPage() {
  const grid = document.getElementById("locations-grid");
  renderLocationCards(grid, LOCATIONS);
}

function initLocationDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const location = LOCATIONS.find((loc) => loc.slug === slug);
  const notFound = document.getElementById("location-not-found");
  const content = document.getElementById("location-content");

  if (!location) {
    if (content) content.hidden = true;
    if (notFound) notFound.hidden = false;
    return;
  }

  if (notFound) notFound.hidden = true;
  if (content) content.hidden = false;
  renderLocationDetail(location);
}

function initHomeLocationsPreview() {
  const grid = document.getElementById("locations-preview");
  renderLocationCards(grid, LOCATIONS.slice(0, 3));
}
