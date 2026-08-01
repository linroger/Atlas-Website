export type DemoLandmark = {
  name: string;
  note: string;
};

export type DemoPhoto = {
  id: number;
  url: string;
  caption: string | null;
  day: number;
};

export type DemoStop = {
  id: number;
  name: string;
  note: string | null;
  day: number;
  lat: number | null;
  lng: number | null;
};

export type DemoChapter = {
  id: number;
  title: string;
  body: string | null;
  photoUrl: string | null;
};

/** The UI-facing journey contract shared by live tRPC data and the static demo. */
export type JourneyDetailData = {
  id: number;
  slug: string;
  title: string;
  destination: string;
  country: string;
  summary: string | null;
  story: string | null;
  landmarks: DemoLandmark[];
  mood: string;
  coverUrl: string | null;
  bannerUrl: string | null;
  videoUrl: string | null;
  narrationUrl: string | null;
  daysCount: number;
  photosCount: number;
  distanceKm: number | null;
  likesCount: number;
  replicatesCount: number;
  viewsCount: number;
  authorName: string | null;
  authorAvatar: string | null;
  featured: boolean;
  likedByMe: boolean;
  replicatedByMe: boolean;
  photos: DemoPhoto[];
  stops: DemoStop[];
  chapters: DemoChapter[];
};

export type JourneyCardData = Pick<
  JourneyDetailData,
  | "id"
  | "slug"
  | "title"
  | "destination"
  | "country"
  | "summary"
  | "mood"
  | "coverUrl"
  | "videoUrl"
  | "daysCount"
  | "likesCount"
  | "replicatesCount"
  | "authorName"
  | "authorAvatar"
  | "featured"
>;

type DemoInput = Omit<
  JourneyDetailData,
  | "id"
  | "photosCount"
  | "bannerUrl"
  | "narrationUrl"
  | "likedByMe"
  | "replicatedByMe"
  | "photos"
  | "stops"
  | "chapters"
> & {
  bannerUrl?: string | null;
  narrationUrl?: string | null;
  photos: Omit<DemoPhoto, "id">[];
  stops: Omit<DemoStop, "id">[];
  chapters: Omit<DemoChapter, "id">[];
};

function defineJourney(id: number, input: DemoInput): JourneyDetailData {
  return {
    ...input,
    id,
    bannerUrl: input.bannerUrl ?? null,
    narrationUrl: input.narrationUrl ?? null,
    likedByMe: false,
    replicatedByMe: false,
    photosCount: input.photos.length,
    photos: input.photos.map((photo, index) => ({ ...photo, id: id * 100 + index + 1 })),
    stops: input.stops.map((stop, index) => ({ ...stop, id: id * 1000 + index + 1 })),
    chapters: input.chapters.map((chapter, index) => ({
      ...chapter,
      id: id * 10_000 + index + 1,
    })),
  };
}

const A = "/assets";

/** Curated, local-only records used when Atlas is built for GitHub Pages. */
export const DEMO_JOURNEYS: JourneyDetailData[] = [
  defineJourney(1, {
    slug: "48-hours-in-tokyo",
    title: "48 Hours in Tokyo: Neon, Temples & One Perfect Sunset",
    destination: "Tokyo",
    country: "Japan",
    summary:
      "Two electric days in Tokyo — from the human river of Shibuya to the incense hush of Senso-ji, ending with an AR whisper that the best sunset was eighteen minutes away.",
    story:
      "Tokyo doesn't overwhelm you all at once — it seduces you in layers. The first hour is the crossing at Shibuya, three thousand people moving like one organism. By hour six it is a six-seat ramen counter in a steamy alley and the best bowl of the year.\n\nDay two slowed down on purpose. Morning incense at Senso-ji gave way to backstreets narrated quietly by Atlas, with no phone and no map between traveler and city.\n\nThe final gift came as an AR card over the skyline: ‘Best sunset begins in 18 minutes.’ Tokyo turned gold, then neon. Forty-eight hours; a lifetime of frames.",
    landmarks: [
      { name: "Shibuya Crossing", note: "Watch the world's busiest scramble from the station, then dive in." },
      { name: "Senso-ji Temple", note: "Arrive before 7am to share Tokyo's oldest temple with incense and quiet." },
      { name: "Meiji Shrine Forest", note: "A 100,000-tree reset in the center of the city." },
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
      { url: `${A}/hero-poster.jpg`, caption: "The sunset card appeared eighteen minutes early.", day: 2 },
      { url: `${A}/gallery/tokyo-1.jpg`, caption: "Senso-ji at dawn.", day: 2 },
      { url: `${A}/gallery/tokyo-2.jpg`, caption: "Six seats, one chef, one perfect bowl.", day: 1 },
    ],
    stops: [
      { name: "Shibuya Crossing", note: "Start where Tokyo pulses hardest.", day: 1, lat: 35.6595, lng: 139.7005 },
      { name: "Meiji Shrine", note: "Forest reset in the city center.", day: 1, lat: 35.6764, lng: 139.6993 },
      { name: "Omoide Yokocho", note: "Lantern alleys for dinner.", day: 1, lat: 35.6931, lng: 139.7004 },
      { name: "Senso-ji Temple", note: "Dawn before the crowds.", day: 2, lat: 35.7148, lng: 139.7967 },
      { name: "Tokyo Tower Viewpoint", note: "The sunset finale.", day: 2, lat: 35.6586, lng: 139.7454 },
    ],
    chapters: [
      { title: "The Human River", body: "Shibuya at 6pm is not a crossing, it is choreography — and Atlas captured it without a screen between Maya and the city.", photoUrl: `${A}/covers/tokyo.jpg` },
      { title: "Steam and Silence", body: "Dinner was decided by a curtain in a doorway. The translated menu helped; the chef's nod needed no translation.", photoUrl: `${A}/gallery/tokyo-2.jpg` },
      { title: "Eighteen Minutes to Gold", body: "The glasses knew about the sunset first. They did not just record the trip; they nudged it toward beauty.", photoUrl: `${A}/hero-poster.jpg` },
    ],
  }),
  defineJourney(2, {
    slug: "kyoto-slow-days",
    title: "Kyoto Slow Days: Torii Tunnels & Tea Steam",
    destination: "Kyoto",
    country: "Japan",
    summary:
      "Four unhurried days in Japan's old capital — ten thousand vermilion gates at dawn, bamboo in the wind, and a tea ceremony that taught the meaning of slow.",
    story:
      "Kyoto rewards the early riser. At 5:40am the tunnel of torii gates held only vermilion light, footsteps, and Atlas naming shrines along the climb.\n\nArashiyama's bamboo creaked like an old house while green columns of light moved across the path. There was nowhere else to be.\n\nThe tea house was the summit: forty minutes for one bowl of matcha, every gesture refined over centuries. Kyoto made even the future slow down and bow.",
    landmarks: [
      { name: "Fushimi Inari Taisha", note: "Enter before 6am; the full mountain loop empties as you climb." },
      { name: "Arashiyama Bamboo Grove", note: "Pair the grove with the quieter Okochi Sanso garden." },
      { name: "Gion", note: "Lantern light on Hanamikoji Street at dusk." },
    ],
    mood: "serene",
    coverUrl: `${A}/covers/kyoto.jpg`,
    videoUrl: null,
    daysCount: 4,
    distanceKm: 52,
    likesCount: 412,
    replicatesCount: 118,
    viewsCount: 7410,
    authorName: "Kenji Watanabe",
    authorAvatar: `${A}/avatars/kenji.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/kyoto.jpg`, caption: "Ten thousand gates, zero people.", day: 1 },
      { url: `${A}/gallery/kyoto-1.jpg`, caption: "The bamboo grove sounds like an old house.", day: 2 },
      { url: `${A}/gallery/kyoto-2.jpg`, caption: "One bowl of matcha, five centuries of ritual.", day: 3 },
    ],
    stops: [
      { name: "Fushimi Inari Taisha", note: "Dawn climb through the gates.", day: 1, lat: 34.9671, lng: 135.7727 },
      { name: "Philosopher's Path", note: "Canal-side walk and coffee.", day: 2, lat: 35.0266, lng: 135.7981 },
      { name: "Arashiyama Bamboo Grove", note: "Green columns of light.", day: 2, lat: 35.017, lng: 135.6711 },
      { name: "Gion Tea House", note: "Matcha ceremony at dusk.", day: 3, lat: 35.0037, lng: 135.7755 },
    ],
    chapters: [
      { title: "The Vermilion Hour", body: "The gates go on until the eyes adjust to a world made only of orange and shadow.", photoUrl: `${A}/covers/kyoto.jpg` },
      { title: "Green Cathedral", body: "Wind through bamboo is a percussion instrument best heard with hands in pockets.", photoUrl: `${A}/gallery/kyoto-1.jpg` },
      { title: "The Slowest Bowl of Tea", body: "Some things deserve your full attention; Kyoto built a city around that idea.", photoUrl: `${A}/gallery/kyoto-2.jpg` },
    ],
  }),
  defineJourney(3, {
    slug: "iceland-ring-road",
    title: "Iceland by Ring Road: Waterfalls, Ice & Black Sand",
    destination: "South Iceland",
    country: "Iceland",
    summary:
      "Seven days driving Route 1 — waterfall rainbows, diamond ice on black beaches, and wind that rewrites every plan.",
    story:
      "Iceland is a geology lesson that never lets you sit down. Seljalandsfoss soaked everything; Jökulsárlón answered with a glacier crack like a rifle shot.\n\nAt Reynisfjara, Atlas marked the sneaker-wave danger zone as a red line in the air before identifying the basalt columns and sea stacks.\n\nThe film it cut from the week is ninety seconds long and still tightens the chest. Some trips you photograph. This one you inhabit.",
    landmarks: [
      { name: "Skógafoss", note: "A 60-meter curtain with near-permanent rainbows on sunny mornings." },
      { name: "Reynisfjara", note: "Keep well back from the waterline; sneaker waves are genuinely dangerous." },
      { name: "Jökulsárlón", note: "Icebergs cross the lagoon toward Diamond Beach." },
    ],
    mood: "cinematic",
    coverUrl: `${A}/covers/iceland.jpg`,
    videoUrl: null,
    daysCount: 7,
    distanceKm: 1322,
    likesCount: 519,
    replicatesCount: 173,
    viewsCount: 9630,
    authorName: "Elias Bergström",
    authorAvatar: `${A}/avatars/elias.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/iceland.jpg`, caption: "The AR safety line at Reynisfjara.", day: 3 },
      { url: `${A}/gallery/iceland-1.jpg`, caption: "Skógafoss double rainbow.", day: 2 },
      { url: `${A}/gallery/iceland-2.jpg`, caption: "Glacial ice glowing blue from within.", day: 5 },
    ],
    stops: [
      { name: "Þingvellir Rift Valley", note: "Walk between tectonic plates.", day: 1, lat: 64.2559, lng: -21.1299 },
      { name: "Seljalandsfoss", note: "Walk behind the waterfall.", day: 2, lat: 63.6156, lng: -19.9886 },
      { name: "Skógafoss", note: "Rainbow curtain and 527 steps.", day: 2, lat: 63.5321, lng: -19.5114 },
      { name: "Reynisfjara", note: "Basalt columns and sneaker waves.", day: 3, lat: 63.4046, lng: -19.127 },
      { name: "Jökulsárlón", note: "Icebergs at midnight sun.", day: 5, lat: 64.0784, lng: -16.2306 },
    ],
    chapters: [
      { title: "Soaked Through", body: "The waterfall drenched everything. Atlas marked the lens compromised and kept filming the joy anyway.", photoUrl: `${A}/gallery/iceland-1.jpg` },
      { title: "The Red Line", body: "Two waves after the glasses warned Elias back, the sea covered exactly where he had stood.", photoUrl: `${A}/covers/iceland.jpg` },
      { title: "Blue From Inside", body: "At 11pm the sun had not set and the icebergs glowed like lanterns.", photoUrl: `${A}/gallery/iceland-2.jpg` },
    ],
  }),
  defineJourney(4, {
    slug: "santorini-aegean-light",
    title: "Santorini: Three Days of Aegean Light",
    destination: "Santorini",
    country: "Greece",
    summary:
      "White villages above a drowned volcano, cappuccinos over the caldera, and an Oia sunset that made three hundred strangers applaud.",
    story:
      "Santorini is a postcard that turns out to be real. Oia's marble lanes belong to the cats and early risers before the day begins.\n\nMidday moved to the water: a catamaran past red cliffs and grilled octopus below three hundred whitewashed steps.\n\nWhen the sun touched the Aegean, the entire castle viewpoint applauded. Hands were busy clapping; Atlas kept the frame.",
    landmarks: [
      { name: "Oia Blue Domes", note: "Arrive before 8am for clear lanes and clean light." },
      { name: "Caldera Hike", note: "A ridge walk above the drowned volcano from Fira to Oia." },
      { name: "Amoudi Bay", note: "Three hundred steps to swimming and seafood." },
    ],
    mood: "golden",
    coverUrl: `${A}/covers/santorini.jpg`,
    videoUrl: null,
    daysCount: 3,
    distanceKm: 24,
    likesCount: 448,
    replicatesCount: 131,
    viewsCount: 8110,
    authorName: "Sofia Marchetti",
    authorAvatar: `${A}/avatars/sofia.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/santorini.jpg`, caption: "Oia stacked above the caldera.", day: 1 },
      { url: `${A}/gallery/santorini-1.jpg`, caption: "Cappuccino over the caldera.", day: 2 },
      { url: `${A}/gallery/santorini-2.jpg`, caption: "Sails on fire with evening light.", day: 2 },
    ],
    stops: [
      { name: "Oia Blue Domes", note: "Dawn photography walk.", day: 1, lat: 36.4618, lng: 25.376 },
      { name: "Caldera Ridge", note: "Walk above the volcano.", day: 2, lat: 36.4328, lng: 25.4228 },
      { name: "Amoudi Bay", note: "Cliff swim and octopus lunch.", day: 2, lat: 36.4614, lng: 25.3717 },
      { name: "Red Beach", note: "Crimson cliffs and ancient Akrotiri.", day: 3, lat: 36.3486, lng: 25.3953 },
    ],
    chapters: [
      { title: "Marble Lanes at Seven", body: "For one hour, Oia belongs to cats, bakers, and the people willing to wake early.", photoUrl: `${A}/covers/santorini.jpg` },
      { title: "Three Hundred Steps", body: "The descent to Amoudi tests the knees; lunch at the bottom is the reward.", photoUrl: `${A}/gallery/santorini-1.jpg` },
      { title: "The Applause", body: "Travel's famous moments can still be its truest ones.", photoUrl: `${A}/gallery/santorini-2.jpg` },
    ],
  }),
  defineJourney(5, {
    slug: "morocco-sahara-crossing",
    title: "Morocco: From the Medina to a Sea of Sand",
    destination: "Marrakech & Merzouga",
    country: "Morocco",
    summary:
      "Six days from Marrakech's spice pyramids over the High Atlas to the Erg Chebbi dunes, with mint tea at every turn.",
    story:
      "Marrakech hits all five senses at once: cumin and orange blossom, calls to prayer over drum circles, and souk alleys lit like jewel boxes.\n\nThe route crossed Tizi n'Tichka, passed Aït Benhaddou, and entered the Sahara on camelback as the dunes turned from gold to rose.\n\nAt dawn, sunrise erased the cold night from the sand. The camera stayed untouched; the glasses had the footage.",
    landmarks: [
      { name: "Jemaa el-Fnaa", note: "Watch the square from a rooftop first, then join it." },
      { name: "Aït Benhaddou", note: "A UNESCO mud-brick ksar on the old caravan route." },
      { name: "Erg Chebbi", note: "Camel in at dusk and climb the big dune before dawn." },
    ],
    mood: "soulful",
    coverUrl: `${A}/covers/morocco.jpg`,
    videoUrl: null,
    daysCount: 6,
    distanceKm: 1140,
    likesCount: 377,
    replicatesCount: 96,
    viewsCount: 6820,
    authorName: "Amara Diallo",
    authorAvatar: `${A}/avatars/amara.jpg`,
    featured: false,
    photos: [
      { url: `${A}/covers/morocco.jpg`, caption: "The caravan at golden hour.", day: 4 },
      { url: `${A}/gallery/morocco-1.jpg`, caption: "Spice pyramids in the souk.", day: 1 },
      { url: `${A}/gallery/morocco-2.jpg`, caption: "The desert camp at blue hour.", day: 4 },
    ],
    stops: [
      { name: "Jemaa el-Fnaa", note: "Rooftop view, then into the square.", day: 1, lat: 31.6258, lng: -7.9891 },
      { name: "The Souks", note: "Spices, lanterns, leather.", day: 1, lat: 31.6275, lng: -7.9868 },
      { name: "Aït Benhaddou", note: "Caravan-route ksar.", day: 3, lat: 31.047, lng: -7.131 },
      { name: "Erg Chebbi", note: "Into the dunes at dusk.", day: 4, lat: 31.0801, lng: -4.0134 },
    ],
    chapters: [
      { title: "Lost, Gloriously", body: "The medina's alleys braid together until maps give up and curiosity takes over.", photoUrl: `${A}/gallery/morocco-1.jpg` },
      { title: "A Sea of Sand", body: "An hour into Erg Chebbi, the noise of the world simply ran out.", photoUrl: `${A}/covers/morocco.jpg` },
      { title: "The Broken Sky", body: "At the camp, the Milky Way wheeled over the dunes like a clock.", photoUrl: `${A}/gallery/morocco-2.jpg` },
    ],
  }),
  defineJourney(6, {
    slug: "patagonia-end-of-the-world",
    title: "Patagonia: Granite Towers at the End of the World",
    destination: "Torres del Paine & El Chaltén",
    country: "Chile & Argentina",
    summary:
      "Eight days among pink granite, calving glaciers, guanacos, and wind that knocks hikers sideways — worth every step.",
    story:
      "Patagonia does not do gentle. The wind nearly took the pack on the trail to the Torres, but at 6am the granite towers lit pink over a glacial lake.\n\nFitz Roy hid behind cloud for two days, then opened a forty-minute window reflected in a still lagoon. Atlas called it a peak visibility event.\n\nPerito Moreno closed the journey: a wall of living ice calving with the sound of artillery.",
    landmarks: [
      { name: "Torres Base", note: "Start before dawn with a headlamp for pink light on the towers." },
      { name: "Laguna de los Tres", note: "The final moraine is steep; the Fitz Roy view earns it." },
      { name: "Perito Moreno", note: "Wait for the crack, then watch the ice wall answer." },
    ],
    mood: "epic",
    coverUrl: `${A}/covers/patagonia.jpg`,
    videoUrl: null,
    daysCount: 8,
    distanceKm: 96,
    likesCount: 503,
    replicatesCount: 148,
    viewsCount: 9070,
    authorName: "Lucas Ferreira",
    authorAvatar: `${A}/avatars/lucas.jpg`,
    featured: true,
    photos: [
      { url: `${A}/covers/patagonia.jpg`, caption: "The Torres igniting pink at 6:12am.", day: 3 },
      { url: `${A}/gallery/patagonia-1.jpg`, caption: "Autumn lenga forest on the Fitz Roy trail.", day: 5 },
      { url: `${A}/gallery/patagonia-2.jpg`, caption: "Perito Moreno calving.", day: 7 },
    ],
    stops: [
      { name: "Puerto Natales", note: "Gear and weather-window check.", day: 1, lat: -51.7263, lng: -72.5068 },
      { name: "Torres Base", note: "Headlamp start for sunrise.", day: 3, lat: -50.9423, lng: -73.4068 },
      { name: "Grey Glacier", note: "Icebergs along the W.", day: 4, lat: -51.0053, lng: -73.222 },
      { name: "Fitz Roy", note: "Laguna de los Tres.", day: 5, lat: -49.4266, lng: -72.8883 },
      { name: "Perito Moreno", note: "The calving wall of ice.", day: 7, lat: -50.4967, lng: -73.1376 },
    ],
    chapters: [
      { title: "Pink Granite", body: "At 6:12 the first light hit the towers and the whole amphitheater glowed like embers.", photoUrl: `${A}/covers/patagonia.jpg` },
      { title: "Forty Minutes of Fitz Roy", body: "Two days of cloud, then a window — just long enough for the final moraine.", photoUrl: `${A}/gallery/patagonia-1.jpg` },
      { title: "The Sound of Ice", body: "The crack arrives before the crash and makes every calving feel like theater.", photoUrl: `${A}/gallery/patagonia-2.jpg` },
    ],
  }),
];

export const DEMO_MOODS = Array.from(
  new Set(DEMO_JOURNEYS.map((journey) => journey.mood)),
);

export type DemoJourneyFilter = {
  q?: string;
  mood?: string;
  featured?: boolean;
  limit?: number;
};

export function filterDemoJourneys({
  q,
  mood = "all",
  featured,
  limit = DEMO_JOURNEYS.length,
}: DemoJourneyFilter = {}): JourneyDetailData[] {
  const query = q?.trim().toLocaleLowerCase();
  return DEMO_JOURNEYS.filter((journey) => {
    if (featured && !journey.featured) return false;
    if (mood !== "all" && journey.mood !== mood) return false;
    if (!query) return true;
    return [journey.title, journey.destination, journey.country, journey.summary]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(query));
  }).slice(0, Math.max(0, limit));
}

export function findDemoJourney(slug: string): JourneyDetailData | undefined {
  return DEMO_JOURNEYS.find((journey) => journey.slug === slug);
}
