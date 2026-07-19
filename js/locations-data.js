/*
 * Dati di esempio (placeholder) per location ed eventi, basati sugli eventi
 * reali mostrati nella sezione "Events" di michelecaramaschi.it.
 * Per aggiornare i contenuti: modifica solo questo file.
 * - "photos" è un elenco di didascalie: sostituisci l'array con oggetti
 *   { src: "assets/img/tuafoto.jpg", caption: "..." } quando avrai le foto reali.
 */

const LOCATIONS = [
  {
    slug: "villa-di-bagno",
    name: "Villa di Bagno",
    city: "Porto Mantovano",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica alle porte di Mantova",
    description:
      "Villa storica a Porto Mantovano, location elegante per eventi privati e ricevimenti con ampi spazi interni ed esterni.",
    capacity: "fino a 180 ospiti",
    events: [
      {
        name: "Villa di Bagno",
        date: "2024-09-21",
        description: "Evento privato con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [
      { caption: "Facciata storica della villa" },
      { caption: "Allestimento serale in giardino" },
      { caption: "Consolle DJ set" },
    ],
  },
  {
    slug: "castelgrimaldo",
    name: "Castelgrimaldo",
    city: "Castelgrimaldo",
    province: "MN",
    country: "Italia",
    tagline: "Location esclusiva per eventi privati",
    description:
      "Location riservata a Castelgrimaldo, scelta per feste private ed eventi su misura in un ambiente raccolto ed esclusivo.",
    capacity: "fino a 100 ospiti",
    events: [
      {
        name: "Castelgrimaldo Private Party",
        date: "2024-09-18",
        description: "Festa privata con intrattenimento musicale e luci scenografiche.",
      },
    ],
    photos: [
      { caption: "Ingresso della location" },
      { caption: "Area lounge allestita" },
    ],
  },
  {
    slug: "villa-arvedi",
    name: "Villa Arvedi",
    city: "Grezzana",
    province: "VR",
    country: "Italia",
    tagline: "Dimora storica nel veronese",
    description:
      "Villa Arvedi, storica dimora nel veronese, location prestigiosa per matrimoni ed eventi aziendali di alto profilo.",
    capacity: "fino a 220 ospiti",
    events: [
      {
        name: "Villa Arvedi",
        date: "2024-09-14",
        description: "Evento con service audio/luci completo e spettacolo live.",
      },
    ],
    photos: [
      { caption: "Vista sul parco della villa" },
      { caption: "Sala ricevimenti" },
      { caption: "Dettaglio allestimento luci" },
      { caption: "Momento dello spettacolo" },
    ],
  },
];

/** Formatta una data ISO (YYYY-MM-DD) in { day, month, full } in italiano. */
function formatEventDate(isoDate) {
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
  ];
  const [year, month, day] = isoDate.split("-").map(Number);
  return {
    day: String(day).padStart(2, "0"),
    month: months[month - 1],
    full: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
  };
}
