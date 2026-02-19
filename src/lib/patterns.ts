import * as heroPatterns from "hero-patterns";

export interface PatternDef {
  key: string;
  label: string;
  fn: (color: string, opacity: number) => string;
}

// Curated subset of heropatterns that look good as backgrounds
export const patterns: PatternDef[] = [
  { key: "topography", label: "Topography", fn: heroPatterns.topography },
  { key: "texture", label: "Texture", fn: heroPatterns.texture },
  { key: "plus", label: "Plus", fn: heroPatterns.plus },
  { key: "polkaDots", label: "Polka Dots", fn: heroPatterns.polkaDots },
  { key: "hexagons", label: "Hexagons", fn: heroPatterns.hexagons },
  { key: "circuitBoard", label: "Circuit Board", fn: heroPatterns.circuitBoard },
  { key: "diagonalStripes", label: "Diagonal Stripes", fn: heroPatterns.diagonalStripes },
  { key: "diagonalLines", label: "Diagonal Lines", fn: heroPatterns.diagonalLines },
  { key: "overlappingCircles", label: "Overlapping Circles", fn: heroPatterns.overlappingCircles },
  { key: "morphingDiamonds", label: "Morphing Diamonds", fn: heroPatterns.morphingDiamonds },
  { key: "brickWall", label: "Brick Wall", fn: heroPatterns.brickWall },
  { key: "wiggle", label: "Wiggle", fn: heroPatterns.wiggle },
  { key: "charlieBrown", label: "Charlie Brown", fn: heroPatterns.charlieBrown },
  { key: "fallingTriangles", label: "Falling Triangles", fn: heroPatterns.fallingTriangles },
  { key: "flippedDiamonds", label: "Flipped Diamonds", fn: heroPatterns.flippedDiamonds },
  { key: "graphPaper", label: "Graph Paper", fn: heroPatterns.graphPaper },
  { key: "heavyRain", label: "Heavy Rain", fn: heroPatterns.heavyRain },
  { key: "overlappingDiamonds", label: "Overlapping Diamonds", fn: heroPatterns.overlappingDiamonds },
  { key: "leaf", label: "Leaf", fn: heroPatterns.leaf },
  { key: "temple", label: "Temple", fn: heroPatterns.temple },
  { key: "stampCollection", label: "Stamp Collection", fn: heroPatterns.stampCollection },
  { key: "endlessClouds", label: "Endless Clouds", fn: heroPatterns.endlessClouds },
  { key: "tinyCheckers", label: "Tiny Checkers", fn: heroPatterns.tinyCheckers },
  { key: "ticTacToe", label: "Tic Tac Toe", fn: heroPatterns.ticTacToe },
  { key: "aztec", label: "Aztec", fn: heroPatterns.aztec },
  { key: "glamorous", label: "Glamorous", fn: heroPatterns.glamorous },
  { key: "anchorsAway", label: "Anchors Away", fn: heroPatterns.anchorsAway },
  { key: "bamboo", label: "Bamboo", fn: heroPatterns.bamboo },
  { key: "bubbles", label: "Bubbles", fn: heroPatterns.bubbles },
  { key: "connections", label: "Connections", fn: heroPatterns.connections },
  { key: "hideout", label: "Hideout", fn: heroPatterns.hideout },
  { key: "jigsaw", label: "Jigsaw", fn: heroPatterns.jigsaw },
  { key: "rain", label: "Rain", fn: heroPatterns.rain },
  { key: "signal", label: "Signal", fn: heroPatterns.signal },
  { key: "squares", label: "Squares", fn: heroPatterns.squares },
  { key: "fourPointStars", label: "Four Point Stars", fn: heroPatterns.fourPointStars },
];

export function getPatternCSS(key: string, color: string, opacity: number = 0.07): string | null {
  if (!key || key === "none") return null;
  const p = patterns.find((p) => p.key === key);
  if (!p) return null;
  return p.fn(color, opacity);
}
