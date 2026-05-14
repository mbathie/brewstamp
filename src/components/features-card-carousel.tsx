"use client";

import { useEffect, useState } from "react";
import CardPreview from "@/components/card-preview";

interface CardSample {
  vertical: string;
  shopName: string;
  displayName: string;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  stamps: number;
  threshold: number;
  totalEarned: number;
  freeRedeemed: number;
}

// Five sample designs across different verticals. The auto-generated brand
// banner inside CardPreview gives each a distinct look without needing real
// logos. Pattern + colour combos are chosen to look reasonably on-brand for
// each vertical (warm orange for a bakery, deep blue + cream for a brewery,
// etc.).
const SAMPLES: CardSample[] = [
  {
    vertical: "Coffee",
    shopName: "Bay Brews",
    displayName: "Sam",
    bgColor: "indigo-700",
    fgColor: "amber-300",
    bgPattern: "diagonalStripes",
    stamps: 3,
    threshold: 8,
    totalEarned: 9,
    freeRedeemed: 1,
  },
  {
    vertical: "Bakery",
    shopName: "Knead",
    displayName: "Mia",
    bgColor: "orange-700",
    fgColor: "amber-100",
    bgPattern: "plus",
    stamps: 5,
    threshold: 6,
    totalEarned: 11,
    freeRedeemed: 1,
  },
  {
    vertical: "Barber",
    shopName: "Cuts & Co.",
    displayName: "Jay",
    bgColor: "stone-900",
    fgColor: "rose-300",
    bgPattern: "hexagons",
    stamps: 6,
    threshold: 10,
    totalEarned: 6,
    freeRedeemed: 0,
  },
  {
    vertical: "Brewery",
    shopName: "Tap Room 12",
    displayName: "Alex",
    bgColor: "teal-800",
    fgColor: "lime-300",
    bgPattern: "polkaDots",
    stamps: 4,
    threshold: 8,
    totalEarned: 12,
    freeRedeemed: 1,
  },
  {
    vertical: "Juice bar",
    shopName: "Smoothie Lab",
    displayName: "Riley",
    bgColor: "pink-700",
    fgColor: "yellow-200",
    bgPattern: "diagonalLines",
    stamps: 2,
    threshold: 5,
    totalEarned: 7,
    freeRedeemed: 1,
  },
];

const ROTATE_MS = 3200;
const FADE_MS = 500;

export default function FeaturesCardCarousel() {
  const [index, setIndex] = useState(0);
  // Fade is `true` while the visible card is faded out for a swap. Keeps both
  // halves of the transition (fade-out then fade-in) on the same React update.
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      const swapId = setTimeout(() => {
        setIndex((i) => (i + 1) % SAMPLES.length);
        setFading(false);
      }, FADE_MS);
      return () => clearTimeout(swapId);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const current = SAMPLES[index];

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Vertical pill — flips with the card. Communicates "any kind of shop"
          without needing extra copy in the parent section. */}
      <div className="mb-4 flex items-center justify-center gap-1.5">
        {SAMPLES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-amber-700" : "w-1.5 bg-stone-300"
            }`}
          />
        ))}
      </div>
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-amber-700">
        For a {current.vertical.toLowerCase()} shop
      </p>
      <div
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <CardPreview
          shopName={current.shopName}
          shopLogo={null}
          stamps={current.stamps}
          threshold={current.threshold}
          totalEarned={current.totalEarned}
          freeRedeemed={current.freeRedeemed}
          bgColor={current.bgColor}
          fgColor={current.fgColor}
          bgPattern={current.bgPattern}
          displayName={current.displayName}
          language="en"
          fitToParent
        />
      </div>
    </div>
  );
}
