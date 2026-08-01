/**
 * Atlas Composer — the writing brain of Atlas AI.
 *
 * Every text feature runs a provider chain:
 *   1. provisioned LLM (when the runtime permits) →
 *   2. deterministic Atlas composition engine, fed by real search
 *      intelligence + photo EXIF metadata.
 * Either way the site always produces a polished result.
 */
import { llmChat, webSearch, type SearchHit } from "./gateway";

// ── helpers ─────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Clean raw search snippets into short, usable sentences. */
export function distillIntel(hits: SearchHit[], maxSentences = 6): string[] {
  const out: string[] = [];
  for (const hit of hits) {
    const text = (hit.content || "").replace(/[#*[\]()>|]/g, " ");
    for (const raw of text.split(/(?<=[.!?])\s+/)) {
      const s = raw.replace(/\s+/g, " ").trim();
      if (s.length < 36 || s.length > 220) continue;
      if (/cookie|subscribe|sign up|copyright|privacy|newsletter/i.test(s))
        continue;
      if (!/[a-zA-Z]/.test(s)) continue;
      out.push(s.charAt(0).toUpperCase() + s.slice(1));
      if (out.length >= maxSentences) return out;
    }
  }
  return out;
}

const GENERIC_TOKENS = new Set(
  `the,this,that,there,these,when,where,what,how,why,best,top,most,one,two,day,days,new,old,san,it,in,on,at,for,and,but,you,your,visit,visiting,travel,traveler,travellers,travelers,traveling,travelling,guide,guides,trip,trips,tips,things,with,from,attraction,attractions,description,tourism,tourist,tourists,itinerary,hotel,hotels,review,reviews,photo,photos,video,videos,ultimate,complete,perfect,must-visit,must-see,must,see,do,map,maps,2024,2025,2026,first,time,local,locals,free,official,site,home,page,ticket,tickets,price,prices,hours,open,opening,access,history,overview,introduction,todo,eat,food,restaurant,restaurants,experience,experiences,tour,tours,activities,activity,destination,destinations,vacation,holiday,holidays,explore,exploring,discover,discovering,place,places,area,areas,city,town,country,world,popular,crowd,crowds,avoid,avoiding,hidden,gem,gems,walking,night,morning,evening,afternoon,week,weekend,month,year,season,spring,summer,autumn,winter,budget,cheap,expensive,luxury,family,kids,solo,couple,couples,honeymoon,backpack,backpacking,wanderlog,tripadvisor,lonely,planet,getyourguide,viator,expedia,booking,kayak,youtube,instagram,pinterest,reddit,quora,blog,blogs,article,articles,newsletter,updated,whether,copyright,shinto,buddhist,stops,between,browse,through,inside,google,facebook,twitter,tiktok,wikipedia,booking,agoda,skyscanner,airbnb,hostelworld,klook,headout,tiqets`.split(","),
);

const PLACE_TYPE_TOKENS = new Set(
  `temple,shrine,park,museum,market,tower,castle,garden,gardens,beach,lake,mountain,mount,mt,falls,bridge,palace,square,street,district,quarter,bay,island,islands,gorge,viewpoint,observatory,station,gate,pagoda,cathedral,church,mosque,cliff,cliffs,glacier,waterfall,valley,desert,dunes,forest,trail,medina,souk,ruins,sanctuary,lagoon,cave,caves,volcano,peak,harbor,harbour,pier,wall,monument,fountain,aquarium,onsen,onsens,bamboo,grove,groves,crossing,alley,alleys,canal,canals,lighthouse,geyser,reef,arch,amphitheater,colosseum,forum,bazaar,souk,souks,onsen,ryokan,kasar,ksar,rijad,riad,crater,geyser,glacier,iceberg,icebergs,terrace,terraces,vineyard,vineyards,winery,distillery,brewery,onsen`.split(","),
);

const IMPERATIVE_STARTERS = new Set(
  "discover,browse,visit,satisfy,explore,enjoy,experience,wander,taste,try,get,take,just,other,another,more,also,check,make,go,see,watch,find,learn,meet,join,stroll,dive,step,head,catch,book,dont,don't,miss,savor,soak,hunt,chase,uncover,unlock".split(","),
);

function isSpecificPlace(name: string): boolean {
  if (name.length < 3 || name.length > 46) return false;
  if (/\d/.test(name)) return false;
  const tokens = name.toLowerCase().split(/[\s'’-]+/).filter(Boolean);
  if (!tokens.length) return false;
  if (IMPERATIVE_STARTERS.has(tokens[0])) return false;
  const specific = tokens.filter((t) => !GENERIC_TOKENS.has(t) && t.length > 1);
  if (!specific.length) return false;
  // contains a place-type word → strong accept
  if (tokens.some((t) => PLACE_TYPE_TOKENS.has(t))) return true;
  // otherwise: mostly-specific multi-word names (e.g. "Fushimi Inari", "Gion Corner")
  if (tokens.length >= 2 && specific.length >= Math.ceil(tokens.length * 0.7)) {
    return specific.join(" ").length >= 7;
  }
  // single specific word of decent length (district names like "Gion", "Asakusa")
  return tokens.length === 1 && specific.length === 1 && tokens[0].length >= 4;
}

/** Pull likely place names out of search snippets, titles first. */
export function extractPlaces(hits: SearchHit[], max = 8): string[] {
  const corpus = hits
    .map((h) => `${h.title || ""} ${h.content || ""}`)
    .join(" ")
    .toLowerCase();
  const places: string[] = [];
  const seen = new Set<string>();
  const freq = (key: string) => corpus.split(key).length - 1;
  const push = (raw: string) => {
    let name = raw
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.,;:!?]+$/, "")
      .replace(/\s+in\s+[A-Z][a-zA-Z]+$/, "")
      .replace(/\s+Description$/i, "");
    // normalize ALL-CAPS shouty titles
    if (/^[A-Z0-9\s'’-]{6,}$/.test(name)) {
      name = name
        .toLowerCase()
        .replace(/(^|\s)([a-z])/g, (_, sp, ch) => `${sp}${ch.toUpperCase()}`);
    }
    const key = name.toLowerCase();
    if (!isSpecificPlace(name) || seen.has(key)) return;
    const tokens = key.split(/[\s'’-]+/).filter(Boolean);
    // single-word candidates need repetition in the corpus to be trusted
    if (tokens.length === 1 && freq(key) < 2) return;
    seen.add(key);
    places.push(name);
  };
  const re =
    /(?:^|[\s,;(])([A-Z][a-zA-Z'’-]+(?:\s+(?:of|de|la|the|no|ji|in)\s*[A-Z][a-zA-Z'’-]+|\s+[A-Z][a-zA-Z'’-]+){0,3})/g;

  // pass 1: titles (highest signal)
  for (const hit of hits) {
    const title = (hit.title || "").split(/[|\-–—:·]/)[0];
    let m: RegExpExecArray | null;
    while ((m = re.exec(` ${title}`))) push(m[1]);
    if (places.length >= max) return places.slice(0, max);
  }
  // pass 2: content
  for (const hit of hits) {
    const text = (hit.content || "").replace(/[#*[\]>]/g, " ");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) push(m[1]);
    if (places.length >= max) break;
  }
  return places.slice(0, max);
}

export async function gatherIntel(destination: string) {
  const queries = [
    `${destination} best landmarks and attractions travel guide`,
    `${destination} local food hidden gems what to do`,
  ];
  const settled = await Promise.allSettled(queries.map((q) => webSearch(q, 4)));
  const hits = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  // drop candidates that merely name the destination/country itself
  const destTokens = new Set(
    destination.toLowerCase().split(/[\s,]+/).filter((t) => t.length > 2),
  );
  const places = extractPlaces(hits, 12).filter((p) => {
    const lower = p.toLowerCase();
    if (destTokens.has(lower)) return false;
    if ([...destTokens].some((t) => lower === t)) return false;
    return true;
  });
  return {
    hits,
    notes: distillIntel(hits, 8),
    places: places.slice(0, 10),
  };
}

// ── Journey story ───────────────────────────────────────────────

export type JourneyDraft = {
  title: string;
  summary: string;
  story: string;
  landmarks: { name: string; note: string }[];
  mood: string;
};

const TITLE_PATTERNS = [
  (d: string, days: number) => `${days} Days in ${d}: A First-Person Journey`,
  (d: string) => `${d}, Through My Eyes`,
  (d: string) => `Chasing Light in ${d}`,
  (d: string) => `The ${d} Diaries`,
  (d: string, days: number) => `${days} Slow Days in ${d}`,
  (d: string) => `${d} Unfiltered`,
];

const OPENERS = [
  (d: string) =>
    `Some places you visit. ${d}, you feel — and from the first morning, it got under my skin.`,
  (d: string) =>
    `I arrived in ${d} with a loose plan and left with a story I'll retell for years.`,
  (d: string) =>
    `${d} doesn't reveal itself all at once. It unfolds — street by street, meal by meal, sunrise by sunrise.`,
  (d: string) =>
    `If you're reading this deciding whether to go to ${d} — go. Here's why, chapter by chapter.`,
];

const MIDDLES = [
  (d: string) =>
    `The rhythm of ${d} took over quickly. Mornings belonged to wandering without a map; afternoons to the kind of small discoveries that never make the guidebooks; evenings to golden light and long dinners.`,
  (d: string) =>
    `What surprised me most about ${d} was how layered it is. Every corner seemed to hold two stories — the one shown to visitors, and the one locals quietly live.`,
  (d: string) =>
    `I let ${d} set the pace. Some days that meant ticking off the landmarks I'd dreamed about; other days it meant sitting still and letting the place come to me.`,
];

const CLOSERS = [
  (d: string) =>
    `Leaving ${d} felt like closing a book mid-chapter. I already know I'll be back to finish it.`,
  (d: string) =>
    `${d} is now pinned permanently on the map of my life — a place I'll measure other journeys against.`,
  (d: string) =>
    `I came home with a full camera roll and a fuller heart. ${d}, until next time.`,
];

export async function composeJourneyStory(input: {
  destination: string;
  country?: string;
  daysCount: number;
  stops: string[];
  intel: { notes: string[]; places: string[] };
  vibeHint?: string;
}): Promise<JourneyDraft> {
  const { destination, daysCount, stops, intel } = input;
  const seed = hashString(destination + daysCount + stops.join("|"));

  // 1) try the provisioned LLM
  const llm = await llmChat([
    {
      role: "system",
      content:
        "You are Atlas AI, a poetic but precise travel writer. Return strict JSON with keys: title, summary (2 sentences), story (3 short paragraphs, first person, evocative), landmarks (array of {name, note} for up to 4 real attractions), mood (one word).",
    },
    {
      role: "user",
      content: `Destination: ${destination}. Days: ${daysCount}. Stops: ${stops.join(", ")}. Field notes from research: ${intel.notes.slice(0, 5).join(" | ")}. Known places: ${intel.places.slice(0, 8).join(", ")}.`,
    },
  ]);
  if (llm) {
    try {
      const start = llm.indexOf("{");
      const parsed: unknown = JSON.parse(llm.slice(start));
      if (isRecord(parsed) && parsed.title && parsed.summary && parsed.story) {
        return {
          title: String(parsed.title).slice(0, 120),
          summary: String(parsed.summary),
          story: String(parsed.story),
          landmarks: Array.isArray(parsed.landmarks)
            ? parsed.landmarks.slice(0, 4).map((value) => {
                const landmark = isRecord(value) ? value : {};
                return {
                  name: String(landmark.name || "").slice(0, 80),
                  note: String(landmark.note || "").slice(0, 240),
                };
              })
            : [],
          mood: String(parsed.mood || "wanderlust").slice(0, 32),
        };
      }
    } catch {
      /* fall through to composer */
    }
  }

  // 2) deterministic composition
  const title = pick(TITLE_PATTERNS, seed)(destination, daysCount);
  const landmarkNames = (
    stops.length ? stops : intel.places.slice(0, 4)
  ).slice(0, 4);
  const landmarks = landmarkNames.map((name, i) => ({
    name,
    note:
      intel.notes[i] ||
      pick(
        [
          `A signature ${destination} experience — go early, before the crowds.`,
          `Locals rate this among the essential ${destination} moments.`,
          `Give yourself time here; it rewards slow looking.`,
          `The light near closing time is unforgettable.`,
        ],
        seed,
        i,
      ),
  }));

  const opener = pick(OPENERS, seed)(destination);
  const middle = pick(MIDDLES, seed, 1)(destination);
  const intelSentence = intel.notes[0]
    ? ` One piece of local wisdom proved true: “${intel.notes[0]}”`
    : "";
  const stopsSentence = stops.length
    ? ` Highlights etched deepest: ${stops.slice(0, 3).join(", ")}${
        stops.length > 3 ? `, and ${stops.length - 3} more pins on my map` : ""
      }.`
    : "";
  const closer = pick(CLOSERS, seed, 2)(destination);

  const story = [
    opener + stopsSentence,
    middle + intelSentence,
    closer,
  ].join("\n\n");

  const summary =
    `${daysCount} day${daysCount > 1 ? "s" : ""} in ${destination}` +
    (landmarks.length
      ? ` — from ${landmarks[0].name}${
          landmarks[1] ? ` to ${landmarks[1].name}` : ""
        }, captured first-person and retold by Atlas AI.`
      : ", captured first-person and retold by Atlas AI.");

  const moods = [
    "wanderlust",
    "serene",
    "electric",
    "golden",
    "cinematic",
    "soulful",
  ];
  return { title, summary, story, landmarks, mood: pick(moods, seed, 3) };
}

// ── AI film & banner prompts ────────────────────────────────────

export function composeFilmPrompt(input: {
  destination: string;
  mood?: string;
  daysCount?: number;
}): string {
  return [
    `Cinematic travel film about ${input.destination}.`,
    `Seamless slow camera motion gliding through the scenes of these travel photos,`,
    `gentle parallax, warm golden-hour color grade, film grain, shallow depth of field,`,
    `emotional wanderlust mood, premium travel-documentary style, no text overlays.`,
  ].join(" ");
}

export function composeBannerPrompt(input: {
  destination: string;
  country?: string;
  mood?: string;
}): string {
  return [
    `Breathtaking wide travel banner photograph of ${input.destination}${
      input.country ? `, ${input.country}` : ""
    }.`,
    `Iconic scenery in soft golden light, airy minimalist composition with open sky,`,
    `pastel gradient tones, dreamy haze, editorial travel-magazine cover style,`,
    `ultra detailed, no text, no watermark.`,
  ].join(" ");
}

// ── Trip planner itinerary ──────────────────────────────────────

export type ItineraryDay = {
  day: number;
  theme: string;
  morning: string;
  afternoon: string;
  evening: string;
  tip?: string;
};

const DAY_THEMES = [
  "First contact — icons & orientation",
  "Local rhythm — neighborhoods & markets",
  "Deeper cuts — hidden gems & viewpoints",
  "Slow day — cafés, culture & golden hour",
  "Wild card — day trip & farewell dinner",
  "Free flow — follow your curiosity",
];

const BUDGET_LINES: Record<string, string> = {
  backpacker: "Street food, hostels and public transit keep this day light on the wallet.",
  comfort: "A comfortable mid-range day — great food, easy transit, one paid highlight.",
  luxury: "Today leans premium: reservations, private transfers and the best tables in town.",
};

export async function composeItinerary(input: {
  destination: string;
  days: number;
  vibes: string[];
  budget: string;
  intel: { notes: string[]; places: string[] };
}): Promise<{ brief: string; days: ItineraryDay[] }> {
  const { destination, days, vibes, budget, intel } = input;
  const seed = hashString(destination + days + vibes.join(","));

  const llm = await llmChat([
    {
      role: "system",
      content:
        "You are Atlas AI, an expert travel planner. Return strict JSON: { brief: string (2 sentences), days: [{ day, theme, morning, afternoon, evening, tip }] }. Use real, specific places from the research. Keep each slot under 30 words.",
    },
    {
      role: "user",
      content: `Plan ${days} days in ${destination}. Vibes: ${vibes.join(", ")}. Budget: ${budget}. Research places: ${intel.places.join(", ")}. Research notes: ${intel.notes.slice(0, 6).join(" | ")}.`,
    },
  ]);
  if (llm) {
    try {
      const parsed: unknown = JSON.parse(llm.slice(llm.indexOf("{")));
      if (isRecord(parsed) && parsed.brief && Array.isArray(parsed.days) && parsed.days.length) {
        return {
          brief: String(parsed.brief),
          days: parsed.days.slice(0, days).map((value, i: number) => {
            const day = isRecord(value) ? value : {};
            return {
              day: i + 1,
              theme: String(day.theme || DAY_THEMES[i % DAY_THEMES.length]),
              morning: String(day.morning || ""),
              afternoon: String(day.afternoon || ""),
              evening: String(day.evening || ""),
              tip: day.tip ? String(day.tip) : undefined,
            };
          }),
        };
      }
    } catch {
      /* fall through */
    }
  }

  const places = intel.places.length
    ? intel.places
    : ["a central neighborhood", "a local food district", "a public viewpoint"];

  const daysOut: ItineraryDay[] = [];
  for (let i = 0; i < days; i++) {
    const anchor = places[i % places.length];
    const extra = places[(i + 2) % places.length];
    daysOut.push({
      day: i + 1,
      theme: DAY_THEMES[i % DAY_THEMES.length],
      morning:
        i === 0
          ? `Land, drop bags, and get your bearings around ${anchor}. Coffee first — always.`
          : `Start early at ${anchor} — soft light, thin crowds, the best photos of the day.`,
      afternoon: `Wander toward ${extra}, following side streets. Lunch wherever the locals queue.`,
      evening: pick(
        [
          `Golden hour at a viewpoint, then dinner somewhere candlelit.`,
          `Night walk through the liveliest district — street food counts as dinner.`,
          `Sunset drinks, then a slow local dinner. Book nothing; ask around.`,
        ],
        seed,
        i,
      ),
      tip:
        intel.notes[i] ||
        (i === 0 ? BUDGET_LINES[budget] : undefined),
    });
  }

  const sourcingNote = intel.places.length
    ? `Atlas AI anchored each day around research-backed places — ${places.slice(0, 3).join(", ")} — and left breathing room for the unplanned.`
    : "Current research did not return verifiable place names, so this draft uses generic activity anchors that should be checked before booking.";
  const brief =
    `${days} day${days > 1 ? "s" : ""} in ${destination}, tuned to a ${vibes.join(" + ") || "wanderlust"} mood on a ${budget} budget. ` +
    sourcingNote;

  return { brief, days: daysOut };
}

// ── Travel DNA ──────────────────────────────────────────────────

export function composeDna(input: {
  name: string;
  countries: number;
  cities: number;
  days: number;
  photos: number;
  journeys: number;
  moods: string[];
  destinations: string[];
}): { archetype: string; tagline: string; narrative: string; traits: string[] } {
  const seed = hashString(input.name + input.destinations.join(","));
  const archetypes = [
    { a: "The Horizon Collector", t: "You measure wealth in sunrises witnessed." },
    { a: "The Urban Flâneur", t: "Cities are your literature; you read them on foot." },
    { a: "The Edge Wanderer", t: "You travel where the map starts to blur." },
    { a: "The Slow Cartographer", t: "You don't visit places. You absorb them." },
    { a: "The Golden Hour Pilgrim", t: "You chase the light, and the light delivers." },
  ];
  const chosen = pick(archetypes, seed);
  const traits = [
    `${input.countries} ${input.countries === 1 ? "country" : "countries"} traced`,
    `${input.days} days on the road`,
    `${input.photos} frames kept`,
    input.moods[0] ? `Drawn to ${input.moods[0]} places` : "Drawn to far places",
  ];
  const narrative =
    `${input.name} moves through the world ${pick(["deliberately", "curiously", "fearlessly", "gently"], seed)} — ` +
    `${input.journeys} ${input.journeys === 1 ? "journey" : "journeys"} so far, from ${input.destinations.slice(0, 2).join(" to ") || "home to horizon"}. ` +
    `Every frame they keep adds a coordinate to a life-sized map that only Atlas can see whole.`;
  return {
    archetype: chosen.a,
    tagline: chosen.t,
    narrative,
    traits: traits.slice(0, 4),
  };
}

// ── Narration script ────────────────────────────────────────────

export function composeNarrationScript(input: {
  title: string;
  destination: string;
  daysCount: number;
  summary: string;
}): string {
  return (
    `${input.title}. ${input.daysCount} day${input.daysCount > 1 ? "s" : ""} in ${input.destination}, recorded on Atlas. ` +
    `${input.summary} Press play — and travel with me.`
  );
}
