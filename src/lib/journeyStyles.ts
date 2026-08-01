const MOOD_HUES: Record<string, string> = {
  electric: "hsl(var(--atlas-sky))",
  serene: "hsl(var(--atlas-mint))",
  golden: "hsl(var(--atlas-peach))",
  cinematic: "hsl(var(--atlas-lavender))",
  soulful: "hsl(340 70% 72%)",
  epic: "hsl(210 60% 55%)",
  wanderlust: "hsl(var(--atlas-sky))",
};

const DAY_COLORS = [
  "hsl(199 89% 55%)",
  "hsl(258 84% 70%)",
  "hsl(24 95% 62%)",
  "hsl(162 64% 45%)",
  "hsl(340 70% 65%)",
  "hsl(45 90% 50%)",
  "hsl(210 60% 55%)",
  "hsl(280 60% 60%)",
];

export function moodHue(mood: string) {
  return MOOD_HUES[mood] || "hsl(var(--atlas-sky))";
}

export function dayColor(day: number) {
  return DAY_COLORS[(day - 1) % DAY_COLORS.length];
}
