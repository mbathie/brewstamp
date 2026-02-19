// Curated pairs of well-contrasting bg/fg Tailwind colors
const colorPairs: [string, string][] = [
  ["stone-800", "amber-600"],
  ["slate-900", "emerald-400"],
  ["zinc-900", "rose-500"],
  ["neutral-900", "sky-400"],
  ["stone-900", "orange-500"],
  ["slate-800", "cyan-400"],
  ["gray-900", "violet-400"],
  ["zinc-800", "lime-400"],
  ["neutral-800", "pink-400"],
  ["stone-800", "teal-400"],
  ["indigo-900", "amber-300"],
  ["emerald-900", "yellow-300"],
  ["rose-900", "amber-300"],
  ["violet-900", "emerald-300"],
  ["teal-900", "orange-300"],
  ["blue-900", "orange-400"],
  ["cyan-900", "pink-300"],
  ["green-800", "sky-300"],
  ["red-900", "cyan-300"],
  ["purple-900", "lime-300"],
  ["amber-800", "slate-100"],
  ["emerald-800", "rose-200"],
  ["sky-800", "amber-300"],
  ["fuchsia-900", "emerald-300"],
  ["pink-900", "teal-300"],
  ["lime-800", "violet-300"],
  ["orange-900", "sky-300"],
  ["teal-800", "rose-300"],
  ["indigo-800", "yellow-400"],
  ["blue-800", "rose-400"],
];

export function getRandomColorPair(): { bgColor: string; fgColor: string } {
  const pair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
  return { bgColor: pair[0], fgColor: pair[1] };
}
