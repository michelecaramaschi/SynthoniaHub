/*
 * Dati di location ed eventi, basati sugli eventi reali mostrati nella
 * sezione "Events" di michelecaramaschi.it (una voce per location distinta,
 * con l'evento più recente registrato per ciascuna).
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
      {
        name: "Villa Arvedi",
        date: "2022-09-09",
        description: "Evento con DJ set e allestimento scenografico.",
      },
    ],
    photos: [
      { caption: "Vista sul parco della villa" },
      { caption: "Sala ricevimenti" },
      { caption: "Dettaglio allestimento luci" },
      { caption: "Momento dello spettacolo" },
    ],
  },
  {
    slug: "villa-dei-mulini",
    name: "Villa dei Mulini",
    city: "Pozzolo sul Mincio",
    province: "MN",
    country: "Italia",
    tagline: "Villa immersa nel verde lungo il Mincio",
    description:
      "Villa dei Mulini, location a Pozzolo sul Mincio scelta più volte per eventi privati e feste estive con DJ set.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa dei Mulini",
        date: "2024-09-08",
        description: "Evento privato con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [
      { caption: "Giardino sul Mincio" },
      { caption: "Allestimento DJ set" },
    ],
  },
  {
    slug: "villa-negri",
    name: "Villa Negri",
    city: "Cesole",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica tra le più richieste per eventi",
    description:
      "Villa Negri a Cesole, una delle location più ricorrenti per eventi privati e ricevimenti eleganti nel mantovano.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Villa Negri",
        date: "2024-09-01",
        description: "Evento privato con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [
      { caption: "Facciata della villa" },
      { caption: "Serata di festa in giardino" },
    ],
  },
  {
    slug: "tenuta-cipressi-e-ulivi",
    name: "Tenuta Cipressi e Ulivi",
    city: "Verona",
    province: "VR",
    country: "Italia",
    tagline: "Tenuta immersa tra cipressi e ulivi secolari",
    description:
      "Tenuta Cipressi e Ulivi a Verona, cornice suggestiva per eventi estivi ed evening party.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Tenuta Cipressi e Ulivi",
        date: "2024-08-03",
        description: "Evento estivo con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sulla tenuta" }],
  },
  {
    slug: "canottieri-mincio",
    name: "Canottieri Mincio",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Storico circolo sul lago, cuore della movida mantovana",
    description:
      "Canottieri Mincio, storico circolo canottieri sul lago di Mantova: location di riferimento per feste estive e format ricorrenti.",
    capacity: "fino a 300 ospiti",
    events: [
      {
        name: "Canottieri Mincio",
        date: "2024-07-26",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
      {
        name: "Ferragosto - Canottieri",
        date: "2023-08-15",
        description: "Party di Ferragosto con DJ set e allestimento scenografico.",
      },
    ],
    photos: [
      { caption: "Vista sul lago" },
      { caption: "Serata estiva in consolle" },
    ],
  },
  {
    slug: "mulino-di-massimbona",
    name: "Mulino di Massimbona",
    city: "Pozzolo sul Mincio",
    province: "MN",
    country: "Italia",
    tagline: "Antico mulino sul Mincio, oggi location per eventi",
    description:
      "Mulino di Massimbona, suggestiva location ricavata da un antico mulino sul Mincio, scelta per eventi estivi e feste private.",
    capacity: "fino a 180 ospiti",
    events: [
      {
        name: "Mulino di Massimbona",
        date: "2024-07-20",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "L'antico mulino sul Mincio" }],
  },
  {
    slug: "villa-monterossa",
    name: "Villa Monterossa",
    city: "Cazzago San Martino",
    province: "BS",
    country: "Italia",
    tagline: "Villa nel cuore della Franciacorta",
    description:
      "Villa Monterossa a Cazzago San Martino, elegante location in Franciacorta per eventi privati e aziendali.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Monterossa",
        date: "2024-07-06",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sulla villa in Franciacorta" }],
  },
  {
    slug: "convento-dellannunciata",
    name: "Convento dell'Annunciata",
    city: "Medole",
    province: "MN",
    country: "Italia",
    tagline: "Ex convento storico, oggi location per eventi esclusivi",
    description:
      "Convento dell'Annunciata a Medole, location storica e suggestiva per matrimoni ed eventi privati di rilievo.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Convento dell'Annunciata",
        date: "2024-06-28",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Chiostro del convento" }],
  },
  {
    slug: "finestra-sul-fiume",
    name: "Finestra sul Fiume",
    city: "Valeggio sul Mincio",
    province: "VR",
    country: "Italia",
    tagline: "Terrazza sul Mincio tra Mantova e Verona",
    description:
      "Finestra sul Fiume a Valeggio sul Mincio, location panoramica affacciata sul fiume per eventi e serate estive.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Finestra sul Fiume",
        date: "2024-06-21",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Terrazza affacciata sul Mincio" }],
  },
  {
    slug: "villa-la-favorita",
    name: "Villa La Favorita",
    city: "Porto Mantovano",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica, tra le location più richieste",
    description:
      "Villa La Favorita a Porto Mantovano, tra le location più ricorrenti per eventi privati, matrimoni e ricevimenti.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Villa La Favorita",
        date: "2024-06-21",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [
      { caption: "Facciata della villa" },
      { caption: "Ricevimento serale" },
    ],
  },
  {
    slug: "villa-pellegrini",
    name: "Villa Pellegrini",
    city: "Verona",
    province: "VR",
    country: "Italia",
    tagline: "Dimora storica veronese",
    description:
      "Villa Pellegrini a Verona, location elegante per eventi privati e ricevimenti nel veronese.",
    capacity: "fino a 180 ospiti",
    events: [
      {
        name: "Villa Pellegrini",
        date: "2024-06-16",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Giardino della villa" }],
  },
  {
    slug: "borgo-la-caccia",
    name: "Borgo La Caccia",
    city: "Monzambano",
    province: "MN",
    country: "Italia",
    tagline: "Borgo rurale ristrutturato per eventi",
    description:
      "Borgo La Caccia a Monzambano, location rustico-elegante per feste private ed eventi immersi nella campagna.",
    capacity: "fino a 120 ospiti",
    events: [
      {
        name: "Borgo La Caccia",
        date: "2024-06-08",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Cortile del borgo" }],
  },
  {
    slug: "alpe-di-siusi",
    name: "Alpe di Siusi",
    city: "Bolzano",
    province: "BZ",
    country: "Italia",
    tagline: "Evento privato in alta quota",
    description:
      "Location d'alta quota sull'Alpe di Siusi, scelta per un evento privato esclusivo tra le Dolomiti.",
    capacity: "su richiesta",
    events: [
      {
        name: "Private Event Alpe di Siusi",
        date: "2024-05-18",
        description: "Evento privato con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Panorama sulle Dolomiti" }],
  },
  {
    slug: "212-soup",
    name: "212 Soup",
    city: "Modena",
    province: "MO",
    country: "Italia",
    tagline: "Locale di tendenza a Modena",
    description:
      "212 Soup a Modena, locale di tendenza per serate ed eventi con DJ set e show dinner.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "212 Soup",
        date: "2024-01-09",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
      {
        name: "Show Dinner 212 - Modena",
        date: "2022-04-22",
        description: "Show dinner con DJ set e spettacolo.",
      },
    ],
    photos: [{ caption: "Interni del locale" }],
  },
  {
    slug: "antoniazzi",
    name: "Antoniazzi",
    city: "Bagnolo San Vito",
    province: "MN",
    country: "Italia",
    tagline: "Location versatile per feste e format serali",
    description:
      "Antoniazzi a Bagnolo San Vito, location per serate a tema e feste private con DJ set ricorrenti.",
    capacity: "fino a 250 ospiti",
    events: [
      {
        name: "Antoniazzi",
        date: "2023-11-24",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
      {
        name: "Friday Night Antoniazzi",
        date: "2022-04-22",
        description: "Serata a tema con DJ set.",
      },
    ],
    photos: [{ caption: "Allestimento serale" }],
  },
  {
    slug: "villa-schiarino",
    name: "Villa Schiarino",
    city: "Porto Mantovano",
    province: "MN",
    country: "Italia",
    tagline: "Villa d'epoca per eventi privati",
    description:
      "Villa Schiarino a Porto Mantovano, dimora d'epoca per ricevimenti ed eventi privati eleganti.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Schiarino",
        date: "2023-10-21",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Facciata della villa" }],
  },
  {
    slug: "corte-costavecchia",
    name: "Corte Costavecchia",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Corte rurale per eventi esclusivi",
    description:
      "Corte Costavecchia nel mantovano, location rustico-elegante per matrimoni ed eventi privati.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Corte Costavecchia",
        date: "2023-09-23",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Cortile della corte" }],
  },
  {
    slug: "fergamma-private-party",
    name: "Fergamma",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Location per feste private esclusive",
    description:
      "Fergamma, location a Mantova per feste ed eventi privati su misura.",
    capacity: "su richiesta",
    events: [
      {
        name: "Fergamma Private Party",
        date: "2023-09-22",
        description: "Festa privata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Allestimento della festa" }],
  },
  {
    slug: "il-tesoro",
    name: "Il Tesoro Living Resort",
    city: "Rivalta sul Mincio",
    province: "MN",
    country: "Italia",
    tagline: "Resort sul Mincio per eventi e feste estive",
    description:
      "Il Tesoro Living Resort a Rivalta sul Mincio, location panoramica sul fiume per feste estive ed eventi privati.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Il Tesoro",
        date: "2023-09-16",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
      {
        name: "Il Tesoro Living Resort",
        date: "2023-05-28",
        description: "Festa estiva con DJ set.",
      },
    ],
    photos: [{ caption: "Vista sul Mincio" }],
  },
  {
    slug: "villa-eden",
    name: "Villa Eden",
    city: "Bagnolo San Vito",
    province: "MN",
    country: "Italia",
    tagline: "Villa immersa nel verde per eventi esclusivi",
    description:
      "Villa Eden a Bagnolo San Vito, location elegante scelta per il format \"La Domenica in Villa\" ed eventi privati.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Eden",
        date: "2023-09-15",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Giardino della villa" }],
  },
  {
    slug: "canottieri",
    name: "Canottieri",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Circolo storico, punto di riferimento per l'estate mantovana",
    description:
      "Canottieri a Mantova, location storica sul lago, sede di format estivi ricorrenti come \"Abbronzatissima\".",
    capacity: "fino a 300 ospiti",
    events: [
      {
        name: "Canottieri",
        date: "2023-09-10",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
      {
        name: "Abbronzatissima - Zanzara",
        date: "2023-09-06",
        description: "Format estivo ricorrente con DJ set.",
      },
    ],
    photos: [{ caption: "Vista sul lago di Mantova" }],
  },
  {
    slug: "forte-benedek",
    name: "Forte Benedek",
    city: "Pastrengo",
    province: "VR",
    country: "Italia",
    tagline: "Fortezza storica per eventi scenografici",
    description:
      "Forte Benedek a Pastrengo, location storica e scenografica per eventi ed intrattenimento.",
    capacity: "su richiesta",
    events: [
      {
        name: "Forte Benedek",
        date: "2023-07-29",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "La fortezza storica" }],
  },
  {
    slug: "chiringuito-club",
    name: "Chiringuito Club",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Beach club sul Mincio",
    description:
      "Chiringuito Club a Mantova, beach club sul Mincio per serate estive e format DJ set ricorrenti.",
    capacity: "fino a 250 ospiti",
    events: [
      {
        name: "Chiringuito Club",
        date: "2023-07-28",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Beach club sul Mincio" }],
  },
  {
    slug: "tenuta-acquaviva",
    name: "Tenuta Acquaviva",
    city: "Travagliato",
    province: "BS",
    country: "Italia",
    tagline: "Tenuta bresciana per eventi privati",
    description:
      "Tenuta Acquaviva a Travagliato, location per matrimoni ed eventi privati nel bresciano.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Tenuta Acquaviva",
        date: "2023-07-27",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sulla tenuta" }],
  },
  {
    slug: "villa-spalletti",
    name: "Villa Spalletti",
    city: "San Donnino",
    province: "MO",
    country: "Italia",
    tagline: "Villa modenese per eventi privati",
    description:
      "Villa Spalletti a San Donnino, location per eventi privati nel modenese.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Spalletti",
        date: "2023-07-22",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Facciata della villa" }],
  },
  {
    slug: "bar-italia",
    name: "Bar Italia",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Locale storico nel cuore di Mantova",
    description:
      "Bar Italia a Mantova, locale storico per serate ed eventi in centro città.",
    capacity: "su richiesta",
    events: [
      {
        name: "Bar Italia",
        date: "2023-07-20",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Interni del locale" }],
  },
  {
    slug: "corte-vaia",
    name: "Corte Vaia",
    city: "Roncoferraro",
    province: "MN",
    country: "Italia",
    tagline: "Corte rurale per eventi privati",
    description:
      "Corte Vaia a Roncoferraro, location rustico-elegante per eventi privati su misura.",
    capacity: "fino a 120 ospiti",
    events: [
      {
        name: "Corte Vaia",
        date: "2023-07-16",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Cortile della corte" }],
  },
  {
    slug: "pattaya-club",
    name: "Pattaya Club",
    city: "Camposanto",
    province: "MO",
    country: "Italia",
    tagline: "Club estivo per feste e DJ set",
    description:
      "Pattaya Club a Camposanto, location per feste estive e serate con DJ set ricorrenti.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Pattaya Club",
        date: "2023-07-14",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Serata al club" }],
  },
  {
    slug: "la-rocca",
    name: "La Rocca",
    city: "Lonato",
    province: "BS",
    country: "Italia",
    tagline: "Location panoramica nel bresciano",
    description:
      "La Rocca a Lonato, location panoramica per eventi privati nel bresciano.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "La Rocca",
        date: "2023-07-02",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista panoramica" }],
  },
  {
    slug: "bigiolla",
    name: "Bigiolla",
    city: "Borgoforte",
    province: "MN",
    country: "Italia",
    tagline: "Location riservata per feste private",
    description:
      "Bigiolla a Borgoforte, location riservata per feste private ed eventi su misura.",
    capacity: "su richiesta",
    events: [
      {
        name: "Bigiolla - Private",
        date: "2023-07-01",
        description: "Festa privata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Allestimento della festa" }],
  },
  {
    slug: "villa-peron",
    name: "Villa Peron",
    city: "Marmirolo",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica per eventi ricorrenti",
    description:
      "Villa Peron a Marmirolo, tra le location più ricorrenti per eventi privati e feste estive.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Peron",
        date: "2023-06-24",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Giardino della villa" }],
  },
  {
    slug: "esplanade",
    name: "Esplanade",
    city: "Desenzano del Garda",
    province: "BS",
    country: "Italia",
    tagline: "Location sul Lago di Garda",
    description:
      "Esplanade a Desenzano del Garda, location panoramica sul lago per eventi e serate estive.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Esplanade",
        date: "2023-06-10",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sul Lago di Garda" }],
  },
  {
    slug: "motonave-zanardelli",
    name: "Motonave Zanardelli",
    city: "Peschiera del Garda",
    province: "VR",
    country: "Italia",
    tagline: "Evento galleggiante sul Lago di Garda",
    description:
      "Motonave Zanardelli, evento a bordo sul Lago di Garda con il format \"Garda Doc\".",
    capacity: "su richiesta",
    events: [
      {
        name: "Motonave Zanardelli - Garda Doc",
        date: "2023-06-08",
        description: "Evento a bordo con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "A bordo della motonave" }],
  },
  {
    slug: "toscanini",
    name: "Toscanini",
    city: "Reggiolo",
    province: "RE",
    country: "Italia",
    tagline: "Location reggiana per eventi privati",
    description:
      "Toscanini a Reggiolo, location per eventi privati e serate con DJ set.",
    capacity: "su richiesta",
    events: [
      {
        name: "Toscanini",
        date: "2023-05-07",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Allestimento serale" }],
  },
  {
    slug: "la-rasdora",
    name: "La Rasdora",
    city: "Porto Mantovano",
    province: "MN",
    country: "Italia",
    tagline: "Location mantovana per eventi privati",
    description:
      "La Rasdora a Porto Mantovano, location per eventi privati ed occasioni speciali.",
    capacity: "su richiesta",
    events: [
      {
        name: "La Rasdora",
        date: "2023-01-28",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Allestimento dell'evento" }],
  },
  {
    slug: "villa-malaspina",
    name: "Villa Malaspina",
    city: "Gualtieri",
    province: "RE",
    country: "Italia",
    tagline: "Dimora storica reggiana",
    description:
      "Villa Malaspina a Gualtieri, dimora storica per eventi privati ed aziendali.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Malaspina",
        date: "2022-09-10",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Facciata della villa" }],
  },
  {
    slug: "villa-conti-cipolla",
    name: "Villa Conti Cipolla",
    city: "Olfino",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica per eventi esclusivi",
    description:
      "Villa Conti Cipolla a Olfino, dimora storica per eventi privati e ricevimenti.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Conti Cipolla",
        date: "2022-09-03",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Giardino della villa" }],
  },
  {
    slug: "villa-cavriani",
    name: "Villa Cavriani",
    city: "Roncoferraro",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica per matrimoni ed eventi",
    description:
      "Villa Cavriani a Roncoferraro, location storica per matrimoni ed eventi privati.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Villa Cavriani",
        date: "2022-08-13",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Facciata della villa" }],
  },
  {
    slug: "villa-cola",
    name: "Villa Cola",
    city: "Castiglione delle Stiviere",
    province: "MN",
    country: "Italia",
    tagline: "Villa storica nel mantovano",
    description:
      "Villa Cola a Castiglione delle Stiviere, location elegante per eventi privati.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Villa Cola",
        date: "2022-07-04",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Giardino della villa" }],
  },
  {
    slug: "emjoy-spazio-te",
    name: "Spazio Te",
    city: "Mantova",
    province: "MN",
    country: "Italia",
    tagline: "Location del format Emjoy a Mantova",
    description:
      "Spazio Te a Mantova, sede del format ricorrente \"Emjoy\" con DJ set e serate a tema.",
    capacity: "fino a 200 ospiti",
    events: [
      {
        name: "Emjoy - Spazio Te",
        date: "2022-06-08",
        description: "Serata con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Serata Emjoy" }],
  },
  {
    slug: "tenuta-aurelia",
    name: "Tenuta Aurelia",
    city: "Reggiolo",
    province: "RE",
    country: "Italia",
    tagline: "Tenuta reggiana per eventi ed opening",
    description:
      "Tenuta Aurelia a Reggiolo, location per eventi privati ed aperture stagionali.",
    capacity: "fino a 150 ospiti",
    events: [
      {
        name: "Opening Tenuta Aurelia",
        date: "2022-05-20",
        description: "Evento di apertura con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sulla tenuta" }],
  },
  {
    slug: "villa-pratola",
    name: "Villa Pratola",
    city: "Portovenere",
    province: "SP",
    country: "Italia",
    tagline: "Villa sul mare ligure",
    description:
      "Villa Pratola a Portovenere, location esclusiva affacciata sul mare ligure.",
    capacity: "su richiesta",
    events: [
      {
        name: "Villa Pratola",
        date: "2022-05-14",
        description: "Evento con DJ set e service audio/luci Synthonia.",
      },
    ],
    photos: [{ caption: "Vista sul mare" }],
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
