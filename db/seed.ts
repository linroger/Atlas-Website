import { getDb } from "../api/queries/connection";
import {
  journeys,
  journeyPhotos,
  journeyStops,
  journeyChapters,
} from "./schema";

const A = "/assets";

type StopSeed = {
  name: string;
  note?: string;
  day: number;
  lat: number;
  lng: number;
};
type ChapterSeed = { title: string; body: string; photoUrl?: string };
type JourneySeed = {
  slug: string;
  title: string;
  destination: string;
  country: string;
  summary: string;
  story: string;
  landmarks: { name: string; note: string }[];
  mood: string;
  coverUrl: string;
  videoUrl?: string;
  daysCount: number;
  distanceKm: number;
  likesCount: number;
  replicatesCount: number;
  viewsCount: number;
  authorName: string;
  authorAvatar: string;
  featured?: boolean;
  photos: { url: string; caption: string; day: number; lat?: number; lng?: number }[];
  stops: StopSeed[];
  chapters: ChapterSeed[];
};

const DATA: JourneySeed[] = [
  {
    slug: "48-hours-in-tokyo",
    title: "48 Hours in Tokyo: Neon, Temples & One Perfect Sunset",
    destination: "Tokyo",
    country: "Japan",
    summary:
      "Two electric days in Tokyo — from the human river of Shibuya to the incense hush of Senso-ji, ending with an AR whisper that the best sunset was eighteen minutes away. It was right.",
    story:
      "Tokyo doesn't overwhelm you all at once — it seduces you in layers. The first hour it's the crossing at Shibuya, three thousand people moving like one organism. By hour six it's a six-seat ramen counter in a steamy alley where the chef slid a bowl toward me without a word, and it was the best thing I ate all year.\n\nDay two slowed down on purpose. Morning incense at Senso-ji, the giant red lantern of Kaminarimon glowing against a pink sky. I let Atlas navigate the backstreets of Asakusa while it narrated three centuries of temple history into my ear — no phone, no map, just the city and a calm voice.\n\nThe trip's final gift came as an AR card over the city: 'Best sunset begins in 18 minutes.' I climbed to the viewpoint behind the torii gate and watched Tokyo turn to gold, then to neon. Forty-eight hours. A lifetime's worth of frames.",
    landmarks: [
      { name: "Shibuya Crossing", note: "The world's busiest scramble — watch it from the second-floor window of the station at rush hour, then dive in." },
      { name: "Senso-ji Temple", note: "Tokyo's oldest temple (628 AD). Arrive before 7am to have the giant Kaminarimon lantern almost to yourself." },
      { name: "Meiji Shrine Forest", note: "A 100,000-tree forest planted by volunteers — the quietest 20 minutes in central Tokyo." },
      { name: "Shinjuku Backstreets", note: "Omoide Yokocho's lantern-lit alleys: yakitori smoke, six-seat counters, zero English menus." },
    ],
    mood: "electric",
    coverUrl: `${A}/covers/tokyo.jpg`,
    videoUrl: `${A}/atlas-film-tokyo.mp4`,
    daysCount: 2,
    distanceKm: 38,
    likesCount: 486,
    replicatesCount: 152,
    viewsCount: 8920,
    authorName: "Maya Chen",
    authorAvatar: `${A}/avatars/maya.jpg`,
    featured: true,
    photos: [
      { url: `${A}/hero-poster.jpg`, caption: "The AR sunset card appeared over the torii viewpoint — 18 minutes early, as promised", day: 2, lat: 35.6586, lng: 139.7454 },
      { url: `${A}/gallery/tokyo-1.jpg`, caption: "Senso-ji at dawn — incense, pink sky, almost no one", day: 2, lat: 35.7148, lng: 139.7967 },
      { url: `${A}/gallery/tokyo-2.jpg`, caption: "Six seats, one chef, the best bowl of the year", day: 1, lat: 35.6938, lng: 139.7034 },
    ],
    stops: [
      { name: "Shibuya Crossing", note: "Start where Tokyo pulses hardest", day: 1, lat: 35.6595, lng: 139.7005 },
      { name: "Meiji Shrine", note: "Forest reset in the city center", day: 1, lat: 35.6764, lng: 139.6993 },
      { name: "Omoide Yokocho", note: "Lantern alleys for yakitori dinner", day: 1, lat: 35.6931, lng: 139.7004 },
      { name: "Senso-ji Temple", note: "Dawn visit, before the crowds", day: 2, lat: 35.7148, lng: 139.7967 },
      { name: "Tokyo Tower Viewpoint", note: "Sunset finale with the AR prompt", day: 2, lat: 35.6586, lng: 139.7454 },
    ],
    chapters: [
      { title: "The Human River", body: "Shibuya at 6pm is not a crossing, it's choreography. I stood in the middle of it wearing Atlas, and for the first time I photographed a city without ever looking at a screen.", photoUrl: `${A}/covers/tokyo.jpg` },
      { title: "Steam and Silence", body: "Dinner was decided by my nose and a curtain in a doorway. Atlas translated the chalkboard menu in the air, but the chef's nod needed no translation.", photoUrl: `${A}/gallery/tokyo-2.jpg` },
      { title: "Eighteen Minutes to Gold", body: "The glasses knew about the sunset before I did. That's the strange magic of this thing — it doesn't just record your trip, it nudges it toward beauty.", photoUrl: `${A}/hero-poster.jpg` },
    ],
  },
  {
    slug: "kyoto-slow-days",
    title: "Kyoto Slow Days: Torii Tunnels & Tea Steam",
    destination: "Kyoto",
    country: "Japan",
    summary:
      "Four unhurried days in Japan's old capital — ten thousand vermilion gates at dawn, bamboo that creaks in the wind, and a tea ceremony that taught me what 'slow' actually means.",
    story:
      "Kyoto rewards the early riser. I walked into Fushimi Inari at 5:40am and had the entire tunnel of ten thousand torii gates to myself — just vermilion light, my footsteps, and Atlas quietly naming each shrine along the climb.\n\nArashiyama's bamboo grove is photographed to death, yet standing inside it you realize why: the stalks creak like an old house, and the light comes down in green columns. I stayed an hour. No agenda.\n\nThe tea house was the day's summit. Forty minutes for one bowl of matcha — every gesture refined over five centuries. The host smiled when she saw the glasses; by the end she was asking Atlas about itself. Kyoto does that: it makes even the future slow down and bow.",
    landmarks: [
      { name: "Fushimi Inari Taisha", note: "10,000+ torii gates. Enter before 6am; the full mountain loop takes 2–3 hours and empties as you climb." },
      { name: "Arashiyama Bamboo Grove", note: "Go at opening or near dusk. Pair it with the quieter Okochi Sanso villa garden next door." },
      { name: "Kinkaku-ji", note: "The Golden Pavilion floats on its mirror pond — best light just after opening." },
      { name: "Gion at Dusk", note: "Lantern light on Hanamikoji Street; if you're lucky, a geiko hurrying to an engagement." },
    ],
    mood: "serene",
    coverUrl: `${A}/covers/kyoto.jpg`,
    daysCount: 4,
    distanceKm: 52,
    likesCount: 412,
    replicatesCount: 118,
    viewsCount: 7410,
    authorName: "Kenji Watanabe",
    authorAvatar: `${A}/avatars/kenji.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/kyoto.jpg`, caption: "5:40am — ten thousand gates, zero people", day: 1, lat: 34.9671, lng: 135.7727 },
      { url: `${A}/gallery/kyoto-1.jpg`, caption: "The bamboo grove sounds like an old wooden house", day: 2, lat: 35.017, lng: 135.6711 },
      { url: `${A}/gallery/kyoto-2.jpg`, caption: "Forty minutes, one bowl of matcha, five centuries of ritual", day: 3, lat: 35.0037, lng: 135.7755 },
    ],
    stops: [
      { name: "Fushimi Inari Taisha", note: "Dawn climb through the gates", day: 1, lat: 34.9671, lng: 135.7727 },
      { name: "Philosopher's Path", note: "Canal-side walk, coffee at a kissaten", day: 2, lat: 35.0266, lng: 135.7981 },
      { name: "Arashiyama Bamboo Grove", note: "Green columns of light", day: 2, lat: 35.017, lng: 135.6711 },
      { name: "Kinkaku-ji", note: "The Golden Pavilion", day: 3, lat: 35.0394, lng: 135.7292 },
      { name: "Gion Tea House", note: "Matcha ceremony at dusk", day: 3, lat: 35.0037, lng: 135.7755 },
    ],
    chapters: [
      { title: "The Vermilion Hour", body: "The gates go on and on until your eyes adjust to a world made only of orange and shadow. Atlas whispered the history of each shrine — I climbed for two hours and never once pulled out my phone.", photoUrl: `${A}/covers/kyoto.jpg` },
      { title: "Green Cathedral", body: "Wind through bamboo is a percussion instrument. I recorded thirty seconds of it with my eyes open and my hands in my pockets.", photoUrl: `${A}/gallery/kyoto-1.jpg` },
      { title: "The Slowest Bowl of Tea", body: "When the matcha was finally placed before me, I understood: Kyoto isn't slow because it's old. It's slow because it decided, long ago, that some things deserve your full attention.", photoUrl: `${A}/gallery/kyoto-2.jpg` },
    ],
  },
  {
    slug: "iceland-ring-road",
    title: "Iceland by Ring Road: Waterfalls, Ice & Black Sand",
    destination: "South Iceland",
    country: "Iceland",
    summary:
      "Seven days driving Route 1 — Skógafoss rainbows, diamond ice on black beaches, and wind that rewrites your plans. Iceland doesn't do 'quick stops'.",
    story:
      "Iceland is a geology lesson that never lets you sit down. Day one the Seljalandsfoss curtain soaked me through; day three I watched a glacier calve into Jökulsárlón with a crack like a rifle shot. Between those moments: hours of hypnotic road, sheep with right of way, and light that changes its mind every five minutes.\n\nAtlas earned its battery at Reynisfjara. Walking the black sand, it flagged the sneaker-wave danger zone in the air — a red line only I could see — then identified the basalt columns and told the legend of the trolls frozen in the sea stacks.\n\nThe vlog it cut from my week is ninety seconds long and it still makes my chest tight. Some trips you photograph. This one I inhabited.",
    landmarks: [
      { name: "Skógafoss", note: "60m curtain of water with near-permanent rainbows on sunny mornings. Climb the 527 steps for the highlands view." },
      { name: "Reynisfjara Black Beach", note: "Sneaker waves are genuinely deadly — keep 30m from the waterline. Basalt columns photograph best at low tide." },
      { name: "Jökulsárlón Glacier Lagoon", note: "Icebergs drift to sea across Diamond Beach. Sunrise and sunset turn the ice electric blue." },
      { name: "Þingvellir Rift Valley", note: "Walk between the North American and Eurasian tectonic plates — and the site of the world's oldest parliament." },
    ],
    mood: "cinematic",
    coverUrl: `${A}/covers/iceland.jpg`,
    daysCount: 7,
    distanceKm: 1322,
    likesCount: 519,
    replicatesCount: 173,
    viewsCount: 9630,
    authorName: "Elias Bergström",
    authorAvatar: `${A}/avatars/elias.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/iceland.jpg`, caption: "Reynisfjara — the AR safety line held while I framed the sea stacks", day: 3, lat: 63.4046, lng: -19.127 },
      { url: `${A}/gallery/iceland-1.jpg`, caption: "Skógafoss double rainbow, 9am, soaked and happy", day: 2, lat: 63.5321, lng: -19.5114 },
      { url: `${A}/gallery/iceland-2.jpg`, caption: "Jökulsárlón at midnight sun — the ice glows blue from inside", day: 5, lat: 64.0784, lng: -16.2306 },
    ],
    stops: [
      { name: "Þingvellir Rift Valley", note: "Between two tectonic plates", day: 1, lat: 64.2559, lng: -21.1299 },
      { name: "Seljalandsfoss", note: "Walk behind the waterfall", day: 2, lat: 63.6156, lng: -19.9886 },
      { name: "Skógafoss", note: "Rainbow curtain + 527 steps", day: 2, lat: 63.5321, lng: -19.5114 },
      { name: "Reynisfjara Black Beach", note: "Basalt columns, sneaker waves", day: 3, lat: 63.4046, lng: -19.127 },
      { name: "Jökulsárlón Lagoon", note: "Icebergs & seals at midnight sun", day: 5, lat: 64.0784, lng: -16.2306 },
      { name: "Hallgrímskirkja, Reykjavík", note: "Farewell view over the colored roofs", day: 7, lat: 64.1417, lng: -21.9266 },
    ],
    chapters: [
      { title: "Soaked Through", body: "The walk behind Seljalandsfoss lasts ninety seconds and drenches you completely. Atlas marked my lens as 'compromised' and kept filming anyway — the footage is blurry, joyful, perfect.", photoUrl: `${A}/gallery/iceland-1.jpg` },
      { title: "The Red Line", body: "On the black sand the glasses drew a line in the air and said: don't cross it. Two waves later I watched the sea grab exactly where I'd been standing.", photoUrl: `${A}/covers/iceland.jpg` },
      { title: "Blue From Inside", body: "At 11pm the sun hadn't set. The icebergs were glowing like lanterns and a seal surfaced three meters away. I forgot to film it. Atlas didn't.", photoUrl: `${A}/gallery/iceland-2.jpg` },
    ],
  },
];

DATA.push(
  {
    slug: "santorini-aegean-light",
    title: "Santorini: Three Days of Aegean Light",
    destination: "Santorini",
    country: "Greece",
    summary:
      "White villages stacked on a drowned volcano, cappuccinos over the caldera, and a sunset in Oia that made three hundred strangers applaud. The Cyclades at their most cinematic.",
    story:
      "Santorini is a postcard that turns out to be real. Every morning I swore I'd seen the best view; every evening the island proved me wrong. The trick is to wake early: Oia's marble lanes are empty at 7am, the blue domes are yours, and the light is so clean it looks manufactured.\n\nMidday belongs to the water — a catamaran past the red cliffs, grilled octopus at Amoudi Bay below three hundred steps of whitewash. Atlas kept translating menus and naming every church I drifted past, which in Santorini is roughly one per minute.\n\nThe Oia sunset crowd is famous, and for once the hype undersells it. When the sun touched the Aegean, three hundred strangers applauded. I filmed none of it — my hands were busy clapping. Atlas filmed all of it.",
    landmarks: [
      { name: "Oia Blue Domes", note: "The postcard shot: arrive before 8am. The three-domed viewpoint near the castle gets crowded fast." },
      { name: "Fira to Oia Caldera Hike", note: "10km of ridge walking above the drowned volcano — 3–4 hours, bring water, unforgettable." },
      { name: "Amoudi Bay", note: "300 steps below Oia: cliff jumping and the island's best seafood tavernas." },
      { name: "Red Beach", note: "Volcanic crimson cliffs over turquoise water — go early, the cove is small." },
    ],
    mood: "golden",
    coverUrl: `${A}/covers/santorini.jpg`,
    daysCount: 3,
    distanceKm: 24,
    likesCount: 448,
    replicatesCount: 131,
    viewsCount: 8110,
    authorName: "Sofia Marchetti",
    authorAvatar: `${A}/avatars/sofia.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/santorini.jpg`, caption: "The cascade of Oia at golden hour — worth every step", day: 1, lat: 36.4618, lng: 25.376 },
      { url: `${A}/gallery/santorini-1.jpg`, caption: "Cappuccino over the caldera, 8am, no one else awake", day: 2, lat: 36.4616, lng: 25.3753 },
      { url: `${A}/gallery/santorini-2.jpg`, caption: "Catamaran past the red cliffs — sails on fire with evening light", day: 2, lat: 36.3901, lng: 25.398 },
    ],
    stops: [
      { name: "Oia Blue Domes", note: "Dawn photography walk", day: 1, lat: 36.4618, lng: 25.376 },
      { name: "Atlantis Books & Castle", note: "Slow morning in the lanes", day: 1, lat: 36.462, lng: 25.3725 },
      { name: "Caldera Hike to Imerovigli", note: "Ridge walk above the volcano", day: 2, lat: 36.4328, lng: 25.4228 },
      { name: "Amoudi Bay", note: "Cliff swim + octopus lunch", day: 2, lat: 36.4614, lng: 25.3717 },
      { name: "Red Beach & Akrotiri", note: "Crimson cliffs, ancient ruins", day: 3, lat: 36.3486, lng: 25.3953 },
    ],
    chapters: [
      { title: "Marble Lanes at Seven", body: "For one hour each morning, Oia belongs to the cats and the early risers. I walked the empty lanes while Atlas whispered which dome was which.", photoUrl: `${A}/covers/santorini.jpg` },
      { title: "Three Hundred Steps to Lunch", body: "The descent to Amoudi is a knee-test; the octopus at the bottom is the reward. A donkey passed me on the way back up, unmoved by my suffering.", photoUrl: `${A}/gallery/santorini-1.jpg` },
      { title: "The Applause", body: "When the sun hit the water, the whole castle viewpoint clapped. Travel's cheesy moments are sometimes its truest.", photoUrl: `${A}/gallery/santorini-2.jpg` },
    ],
  },
  {
    slug: "morocco-sahara-crossing",
    title: "Morocco: From the Medina to a Sea of Sand",
    destination: "Marrakech & Merzouga",
    country: "Morocco",
    summary:
      "Six days from Marrakech's spice pyramids over the High Atlas to the Erg Chebbi dunes — camel caravans, a desert camp under absurd numbers of stars, and mint tea everywhere.",
    story:
      "Marrakech hits all five senses at once: cumin and orange blossom, the call to prayer over drum circles, souk alleys lit like jewel boxes. I got gloriously lost in the medina for three hours — Atlas retraced my steps in the air when I finally wanted out.\n\nThen the landscape took over. Over the Tizi n'Tichka pass, past the mud-brick ksar of Aït Benhaddou, and into the Sahara on camelback as the dunes turned from gold to rose. The camp that night: berber drums around the fire, and so many stars the sky looked broken.\n\nI woke at 5am to climb the big dune. Watching sunrise erase the cold night from the sand, I thought: this is why we carry cameras. Then I realized I hadn't touched mine all week — and had the footage to prove it.",
    landmarks: [
      { name: "Jemaa el-Fnaa", note: "The great square: juice stalls by day, a hundred grills by night. Watch from a rooftop café first, then dive in." },
      { name: "The Souks", note: "Spice pyramids and brass lantern forests. Haggle to ~40% of the first price, with a smile." },
      { name: "Aït Benhaddou", note: "UNESCO mud-brick ksar on the old caravan route — Gladiator and Game of Thrones filmed here." },
      { name: "Erg Chebbi Dunes", note: "150m dunes at Merzouga. Camel in at dusk, climb the big dune at dawn." },
    ],
    mood: "soulful",
    coverUrl: `${A}/covers/morocco.jpg`,
    daysCount: 6,
    distanceKm: 1140,
    likesCount: 377,
    replicatesCount: 96,
    viewsCount: 6820,
    authorName: "Amara Diallo",
    authorAvatar: `${A}/avatars/amara.jpg`,
    featured: false,
    photos: [
      { url: `${A}/covers/morocco.jpg`, caption: "The caravan stretching across Erg Chebbi at golden hour", day: 4, lat: 31.0801, lng: -4.0134 },
      { url: `${A}/gallery/morocco-1.jpg`, caption: "Spice pyramids in the souk — cumin, paprika, dried roses", day: 1, lat: 31.6275, lng: -7.9868 },
      { url: `${A}/gallery/morocco-2.jpg`, caption: "The desert camp at blue hour — drums starting, stars arriving", day: 4, lat: 31.0808, lng: -4.0128 },
    ],
    stops: [
      { name: "Jemaa el-Fnaa", note: "Rooftop view, then into the square", day: 1, lat: 31.6258, lng: -7.9891 },
      { name: "The Souks", note: "Spices, lanterns, leather", day: 1, lat: 31.6275, lng: -7.9868 },
      { name: "Jardin Majorelle", note: "Cobalt blue garden pause", day: 2, lat: 31.6417, lng: -8.0029 },
      { name: "Aït Benhaddou", note: "Caravan-route ksar", day: 3, lat: 31.047, lng: -7.131 },
      { name: "Erg Chebbi Camel Trek", note: "Into the dunes at dusk", day: 4, lat: 31.0801, lng: -4.0134 },
      { name: "Fes Medina", note: "Tanneries and 9,000 alleys", day: 6, lat: 34.0611, lng: -4.9773 },
    ],
    chapters: [
      { title: "Lost, Gloriously", body: "The medina's alleys braid into each other until Google gives up. I let myself get lost for three hours and found a brass-worker who showed me his grandfather's tools.", photoUrl: `${A}/gallery/morocco-1.jpg` },
      { title: "A Sea of Sand", body: "Camels walk like they're thinking about something else. An hour into Erg Chebbi the noise of the world simply ran out — only wind over sand.", photoUrl: `${A}/covers/morocco.jpg` },
      { title: "The Broken Sky", body: "At the camp I counted shooting stars until I lost count at eleven. Atlas timelapsed the whole night; the Milky Way wheels like a clock.", photoUrl: `${A}/gallery/morocco-2.jpg` },
    ],
  },
  {
    slug: "patagonia-end-of-the-world",
    title: "Patagonia: Granite Towers at the End of the World",
    destination: "Torres del Paine & El Chaltén",
    country: "Chile & Argentina",
    summary:
      "Eight days among the planet's most dramatic mountains — pink granite at sunrise, calving glaciers, guanacos, and wind that knocks you sideways. Worth every step of the W.",
    story:
      "Patagonia doesn't do gentle. The wind on the trail to the Torres base nearly took my pack; a guanaco watched, unimpressed. But at 6am the granite towers lit up pink over the glacial lake, and every frozen finger was forgiven.\n\nFitz Roy played hide-and-seek behind clouds for two days. On day three the sky opened for exactly forty minutes — long enough for Atlas to guide me up the final moraine and catch the peak reflected in a still lagoon. The glasses logged it as 'peak visibility event'. I logged it as 'nearly cried'.\n\nPerito Moreno was the finale: a 60-meter wall of living ice that calves with a sound like artillery. You don't photograph Patagonia. You survive it, and the photos come as evidence.",
    landmarks: [
      { name: "Torres del Paine Base", note: "The sunrise shot: 4–5h from Hotel Las Torres. Start at 4:30am with a headlamp for the pink towers." },
      { name: "Mount Fitz Roy / Laguna de los Tres", note: "El Chaltén's crown hike — 10km, 750m gain. The last kilometer is steep moraine." },
      { name: "Perito Moreno Glacier", note: "One of Earth's few advancing glaciers. Boardwalks face 60m of calving ice — wait for the crack." },
      { name: "Grey Glacier & Lake", note: "Part of the W trek: blue icebergs drift down a milky lake beneath the Paine massif." },
    ],
    mood: "epic",
    coverUrl: `${A}/covers/patagonia.jpg`,
    daysCount: 8,
    distanceKm: 96,
    likesCount: 503,
    replicatesCount: 148,
    viewsCount: 9070,
    authorName: "Lucas Ferreira",
    authorAvatar: `${A}/avatars/lucas.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/patagonia.jpg`, caption: "The Torres igniting pink above the glacial lake, 6:12am", day: 3, lat: -50.9423, lng: -73.4068 },
      { url: `${A}/gallery/patagonia-1.jpg`, caption: "Autumn lenga forest on the Fitz Roy trail", day: 5, lat: -49.4266, lng: -72.8883 },
      { url: `${A}/gallery/patagonia-2.jpg`, caption: "Perito Moreno calving — the sound arrives two seconds late", day: 7, lat: -50.4967, lng: -73.1376 },
    ],
    stops: [
      { name: "Puerto Natales", note: "Gear up, empanadas, weather window check", day: 1, lat: -51.7263, lng: -72.5068 },
      { name: "Torres Base Trek", note: "Headlamp start for sunrise", day: 3, lat: -50.9423, lng: -73.4068 },
      { name: "Grey Glacier", note: "Icebergs on the W", day: 4, lat: -51.0053, lng: -73.222 },
      { name: "El Chaltén & Fitz Roy", note: "Laguna de los Tres", day: 5, lat: -49.4266, lng: -72.8883 },
      { name: "Perito Moreno", note: "The calving wall of ice", day: 7, lat: -50.4967, lng: -73.1376 },
    ],
    chapters: [
      { title: "Pink Granite", body: "At 6:12 the first light hit the towers and the whole amphitheater glowed like embers. Around me, thirty frozen strangers forgot to complain.", photoUrl: `${A}/covers/patagonia.jpg` },
      { title: "Forty Minutes of Fitz Roy", body: "Two days of cloud, then a window. Atlas pinged 'visibility event' and I ran the last moraine like a mountain goat with a deadline.", photoUrl: `${A}/gallery/patagonia-1.jpg` },
      { title: "The Sound of Ice", body: "The crack reaches you before the crash does — a delay that makes every calving feel like theater. I watched for three hours.", photoUrl: `${A}/gallery/patagonia-2.jpg` },
    ],
  },
  {
    slug: "vietnam-lantern-trail",
    title: "Vietnam's Lantern Trail: Hoi An to Ha Long Bay",
    destination: "Hoi An & Ha Long Bay",
    country: "Vietnam",
    summary:
      "Five days following the lights — silk lanterns on the Thu Bon river, karst islands rising from emerald water, and the best cao lau of my life from a cart with no name.",
    story:
      "Hoi An at dusk is what happens when a whole town agrees to be beautiful. The electric lights go soft and the silk lanterns take over — hundreds of them, reflected in the river until you can't tell up from down. I released a paper lantern and made the required wish.\n\nThe food deserves its own journey: cao lau noodles that only work with water from one ancient well, white rose dumplings from a single family recipe, banh mi that ruins you for all other sandwiches. Atlas translated menus and flagged hygiene ratings in the air; I just pointed and ate.\n\nHa Long Bay was the contrast — silence after the festival. Our junk boat slid between limestone karsts at dawn, mist peeling off emerald water. I kayaked into a lagoon with no one in it and floated a while. Some frames you keep; some moments keep you.",
    landmarks: [
      { name: "Hoi An Ancient Town", note: "Lantern hour is 6–8pm. The monthly full-moon festival turns off all electric light — time your trip if you can." },
      { name: "Thu Bon River Lanterns", note: "Release a paper lantern from a sampan (50k VND). Corny, gorgeous, non-negotiable." },
      { name: "Ha Long Bay Overnight Cruise", note: "One night minimum on the water. Dawn kayak among the karsts is the actual highlight." },
      { name: "Hanoi Old Quarter", note: "36 streets, each named for its trade. Egg coffee at Café Giảng — trust the process." },
    ],
    mood: "golden",
    coverUrl: `${A}/covers/vietnam.jpg`,
    daysCount: 5,
    distanceKm: 830,
    likesCount: 391,
    replicatesCount: 104,
    viewsCount: 7230,
    authorName: "Maya Chen",
    authorAvatar: `${A}/avatars/maya.jpg`,
    featured: false,
    photos: [
      { url: `${A}/covers/vietnam.jpg`, caption: "Hoi An's river turning into a mirror of lanterns", day: 1, lat: 15.8801, lng: 108.338 },
      { url: `${A}/gallery/vietnam-1.jpg`, caption: "Karsts in the mist — our junk boat had the bay to itself at 6am", day: 4, lat: 20.9101, lng: 107.1839 },
      { url: `${A}/gallery/vietnam-2.jpg`, caption: "One lantern, one wish, released into the Thu Bon", day: 2, lat: 15.8805, lng: 108.3385 },
    ],
    stops: [
      { name: "Hoi An Ancient Town", note: "Lantern hour walk", day: 1, lat: 15.8801, lng: 108.338 },
      { name: "Thu Bon River Sampan", note: "Release a lantern at dusk", day: 2, lat: 15.8805, lng: 108.3385 },
      { name: "An Bang Beach", note: "Recovery morning, seafood lunch", day: 3, lat: 15.8916, lng: 108.3547 },
      { name: "Ha Long Bay Cruise", note: "Overnight among the karsts", day: 4, lat: 20.9101, lng: 107.1839 },
      { name: "Hanoi Old Quarter", note: "Egg coffee farewell", day: 5, lat: 21.033, lng: 105.85 },
    ],
    chapters: [
      { title: "The Lantern Agreement", body: "At dusk the town dims its electric lights on purpose, and silk takes over. I photographed nothing for ten minutes — just stood on the bridge being happy.", photoUrl: `${A}/covers/vietnam.jpg` },
      { title: "The Cart With No Name", body: "The best cao lau came from a cart Atlas couldn't find on any map. We pinned it for the next traveler: 'trust the blue plastic stools.'", photoUrl: `${A}/gallery/vietnam-2.jpg` },
      { title: "Emerald Silence", body: "Dawn kayak, mist on the water, karsts like sleeping dragons. My paddle was the loudest thing for kilometers.", photoUrl: `${A}/gallery/vietnam-1.jpg` },
    ],
  },
  {
    slug: "swiss-alps-rail-and-ridge",
    title: "Swiss Alps by Rail & Ridge: Matterhorn Week",
    destination: "Zermatt & Grindelwald",
    country: "Switzerland",
    summary:
      "Five days riding panoramic trains between storybook valleys — the Matterhorn reflected in a still lake at sunrise, fondue above the clouds, and engineering so scenic it feels illegal.",
    story:
      "Switzerland's trains are a cheat code. The red Glacier Express crawls over stone viaducts above green valleys while you drink coffee like it's a cinema. I kept checking the window to confirm it wasn't a screen.\n\nZermatt is car-free, so the town smells of pine and bakery instead of exhaust. At 5am I hiked to Stellisee and waited. The Matterhorn arrived slowly — first a silhouette, then pink fire, then a perfect double in the lake. Atlas narrated the geology; I narrated some words that aren't printable.\n\nThe fondue terrace above Grindelwald was the closing scene: cheese, chocolate-box peaks, and a sunset that turned the Eiger north face orange. Expensive? Yes. Would I trade it? Not a frame.",
    landmarks: [
      { name: "Stellisee Sunrise", note: "25 min from Blauherd station: the classic Matterhorn reflection. First cable car + short hike gets you there before crowds." },
      { name: "Glacier Express", note: "The 'slowest express train in the world' — 291 bridges, 91 tunnels. Book the panoramic carriage." },
      { name: "Gornergrat Railway", note: "Cogwheel to 3,089m for the Monte Rosa glacier panorama. Sit on the right side going up." },
      { name: "Lauterbrunnen Valley", note: "72 waterfalls in one glacial valley — Staubbach Falls drops 300m beside the village." },
    ],
    mood: "serene",
    coverUrl: `${A}/covers/alps.jpg`,
    daysCount: 5,
    distanceKm: 310,
    likesCount: 358,
    replicatesCount: 91,
    viewsCount: 6540,
    authorName: "Elias Bergström",
    authorAvatar: `${A}/avatars/elias.jpg`,
    featured: false,
    photos: [
      { url: `${A}/covers/alps.jpg`, caption: "The red train over the Landwasser viaduct — public transport as cinema", day: 2, lat: 46.6808, lng: 9.6755 },
      { url: `${A}/gallery/alps-1.jpg`, caption: "Stellisee at 6am — the Matterhorn and its double", day: 3, lat: 46.0059, lng: 7.7753 },
      { url: `${A}/gallery/alps-2.jpg`, caption: "Fondue with the Eiger watching", day: 4, lat: 46.6242, lng: 8.0414 },
    ],
    stops: [
      { name: "Zermatt Old Village", note: "Car-free lanes, larch chalets", day: 1, lat: 46.0207, lng: 7.7491 },
      { name: "Glacier Express", note: "Viaducts & panoramic carriage", day: 2, lat: 46.6808, lng: 9.6755 },
      { name: "Stellisee", note: "Matterhorn reflection at dawn", day: 3, lat: 46.0059, lng: 7.7753 },
      { name: "Gornergrat", note: "3,089m glacier panorama", day: 3, lat: 45.9834, lng: 7.7851 },
      { name: "Grindelwald Terrace", note: "Fondue finale over the valley", day: 4, lat: 46.6242, lng: 8.0414 },
    ],
    chapters: [
      { title: "The Cheat Code", body: "Swiss rail is engineered like watchmaking and staged like opera. The viaduct curve comes with its own gasp from every passenger.", photoUrl: `${A}/covers/alps.jpg` },
      { title: "The Double Mountain", body: "For eleven minutes the lake was glass and there were two Matterhorns. Then the wind woke up and took one.", photoUrl: `${A}/gallery/alps-1.jpg` },
      { title: "Cheese at Altitude", body: "Fondue tastes 40% better when the Eiger is turning orange in front of you. This is science.", photoUrl: `${A}/gallery/alps-2.jpg` },
    ],
  },
  {
    slug: "bali-island-of-gods",
    title: "Bali: Rice Terraces, Temples & Floating Breakfasts",
    destination: "Ubud & Uluwatu",
    country: "Indonesia",
    summary:
      "Six days on the Island of the Gods — emerald rice terraces at misty dawn, a fire dance on a sea cliff at sunset, and jungle mornings that reset your nervous system.",
    story:
      "Bali has two speeds and both are medicine. Morning speed: the Tegallalang terraces at 6:30am, mist in the palms, water moving down the levels like the hillside is breathing. Evening speed: parked at a warung with a fresh coconut, going nowhere.\n\nUluwatu was the spectacle. The temple sits on a 70-meter cliff, and at sunset the kecak fire dance begins — a hundred men chanting in a circle while the sky does its own performance behind them. Atlas subtitled the chant's story in the air: the Ramayana, live, over the Indian Ocean.\n\nThe last morning was a floating breakfast in a jungle infinity pool, mist below, dragonfruit on the tray. Touristy? Completely. Regrets? Zero. Bali's trick is that even its clichés are sincere.",
    landmarks: [
      { name: "Tegallalang Rice Terraces", note: "Arrive before 7am for mist and no crowds. Small donations at each farmer's gate — carry small cash." },
      { name: "Uluwatu Temple & Kecak", note: "Sunset fire dance on the cliff. Book the 6pm show and guard your sunglasses from the monkeys." },
      { name: "Tirta Empul", note: "Holy spring purification ritual — sarongs provided, move through all 13 fountains respectfully." },
      { name: "Campuhan Ridge Walk", note: "Ubud's easiest golden-hour walk — grass ridges and palm valleys, free, 2km." },
    ],
    mood: "soulful",
    coverUrl: `${A}/covers/bali.jpg`,
    daysCount: 6,
    distanceKm: 140,
    likesCount: 402,
    replicatesCount: 112,
    viewsCount: 7180,
    authorName: "Sofia Marchetti",
    authorAvatar: `${A}/avatars/sofia.jpg`,
    featured: false,
    photos: [
      { url: `${A}/covers/bali.jpg`, caption: "The terraces breathing morning mist, Tegallalang", day: 2, lat: -8.4312, lng: 115.2776 },
      { url: `${A}/gallery/bali-1.jpg`, caption: "Kecak fire dance on the Uluwatu cliff — the Ramayana over the ocean", day: 4, lat: -8.8291, lng: 115.0849 },
      { url: `${A}/gallery/bali-2.jpg`, caption: "Floating breakfast above the jungle mist. Zero regrets.", day: 6, lat: -8.5069, lng: 115.2625 },
    ],
    stops: [
      { name: "Ubud Market & Palace", note: "Batik, incense, morning offerings", day: 1, lat: -8.5069, lng: 115.2625 },
      { name: "Tegallalang Rice Terraces", note: "Dawn mist walk", day: 2, lat: -8.4312, lng: 115.2776 },
      { name: "Tirta Empul", note: "Holy spring ritual", day: 3, lat: -8.4162, lng: 115.3154 },
      { name: "Uluwatu Temple", note: "Sunset kecak on the cliff", day: 4, lat: -8.8291, lng: 115.0849 },
      { name: "Canggu Beach", note: "Surf lessons and sunset bars", day: 5, lat: -8.6478, lng: 115.1385 },
    ],
    chapters: [
      { title: "The Breathing Hillside", body: "Water steps down the terraces level by level — a thousand-year-old irrigation cooperative called subak. Atlas told me it's UNESCO-listed; my feet told me it's slippery.", photoUrl: `${A}/covers/bali.jpg` },
      { title: "Fire Over the Ocean", body: "A hundred voices chanting 'cak-cak-cak' while the sun dropped into the sea. I didn't know the story; the glasses narrated it live.", photoUrl: `${A}/gallery/bali-1.jpg` },
      { title: "The Sincere Cliché", body: "Yes, my breakfast floated. Yes, I photographed it. Bali forgives your clichés because it invented most of them.", photoUrl: `${A}/gallery/bali-2.jpg` },
    ],
  },
);

async function seed() {
  const db = getDb();
  console.log("Seeding Atlas journeys...");
  const existing = await db.select({ id: journeys.id }).from(journeys);
  if (existing.length) {
    console.log(`Database already has ${existing.length} journeys — skipping seed.`);
    process.exit(0);
  }
  for (const j of DATA) {
    const [result] = await db.insert(journeys).values({
      slug: j.slug,
      title: j.title,
      destination: j.destination,
      country: j.country,
      summary: j.summary,
      story: j.story,
      landmarks: JSON.stringify(j.landmarks),
      mood: j.mood,
      coverUrl: j.coverUrl,
      videoUrl: j.videoUrl || null,
      daysCount: j.daysCount,
      photosCount: j.photos.length,
      distanceKm: j.distanceKm,
      likesCount: j.likesCount,
      replicatesCount: j.replicatesCount,
      viewsCount: j.viewsCount,
      authorName: j.authorName,
      authorAvatar: j.authorAvatar,
      featured: Boolean(j.featured),
    });
    const journeyId = Number(result.insertId);
    await db.insert(journeyPhotos).values(
      j.photos.map((p, i) => ({
        journeyId,
        url: p.url,
        caption: p.caption,
        day: p.day,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
        sortOrder: i,
      })),
    );
    await db.insert(journeyStops).values(
      j.stops.map((s, i) => ({
        journeyId,
        name: s.name,
        note: s.note || null,
        day: s.day,
        stopOrder: i,
        lat: s.lat,
        lng: s.lng,
      })),
    );
    await db.insert(journeyChapters).values(
      j.chapters.map((c, i) => ({
        journeyId,
        title: c.title,
        body: c.body,
        chapterOrder: i,
        photoUrl: c.photoUrl || null,
      })),
    );
    console.log(`  ✓ ${j.title}`);
  }
  console.log("Seeded", DATA.length, "journeys. Done.");
  process.exit(0);
}

seed();
