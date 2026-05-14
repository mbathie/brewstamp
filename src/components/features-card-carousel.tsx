"use client";

import { useEffect, useState } from "react";
import CardPreview from "@/components/card-preview";

interface CardSample {
  vertical: string;
  shopName: string;
  shopLogo: string;
  displayName: string;
  bgColor: string;
  fgColor: string;
  bgPattern: string;
  stamps: number;
  threshold: number;
  totalEarned: number;
  freeRedeemed: number;
}

// Sample designs across different shop styles. Each entry pairs a real
// hand-designed logo PNG with card colours + pattern that complement it.
// Stamp counts are capped at 8 (threshold ≤ 8) so the 4-col grid never
// grows past 2 rows mid-rotation — otherwise the section below shifts.
const SAMPLES: CardSample[] = [
  {
    vertical: "Coffee shop",
    shopName: "The Rusty Mug",
    shopLogo: "/sample-logos/the-rusty-mug.png",
    displayName: "Sam",
    bgColor: "stone-800",
    fgColor: "amber-300",
    bgPattern: "topography",
    stamps: 4,
    threshold: 8,
    totalEarned: 11,
    freeRedeemed: 1,
  },
  {
    vertical: "Surf-side cafe",
    shopName: "Byron Bay Brewz",
    shopLogo: "/sample-logos/byron-bay-brewz.png",
    displayName: "Riley",
    bgColor: "teal-900",
    fgColor: "orange-200",
    bgPattern: "polkaDots",
    stamps: 2,
    threshold: 7,
    totalEarned: 9,
    freeRedeemed: 1,
  },
  {
    vertical: "Barber shop",
    shopName: "Cutthroat Barber Shop",
    shopLogo: "/sample-logos/cutthroat-barber-shop.png",
    displayName: "Jay",
    // Logo palette is cream + gold + black — pair the dark card with an
    // amber/gold foreground so the stamps area picks up the lightning-bolt
    // accents in the logo.
    bgColor: "stone-900",
    fgColor: "amber-400",
    bgPattern: "hexagons",
    stamps: 3,
    threshold: 8,
    totalEarned: 3,
    freeRedeemed: 0,
  },
  {
    vertical: "Bakery & cafe",
    shopName: "Belle Bean Coffee",
    shopLogo: "/sample-logos/belle-bean.png",
    displayName: "Ava",
    // Soft floral logo (rose + peach + cream). Pair with a warm pink card
    // and creamy fg so the stamps area picks up the rose wordmark colour.
    bgColor: "pink-900",
    fgColor: "rose-200",
    bgPattern: "leaf",
    stamps: 5,
    threshold: 8,
    totalEarned: 13,
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

  // Read modulo length so a stale `index` (e.g. left over from a longer
  // SAMPLES array during HMR) never lands on `undefined`.
  const current = SAMPLES[index % SAMPLES.length];

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
        For a {current.vertical.toLowerCase()}
      </p>
      <div
        className="transition-opacity duration-500 ease-out"
        style={{ opacity: fading ? 0 : 1 }}
      >
        <CardPreview
          shopName={current.shopName}
          shopLogo={current.shopLogo}
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
