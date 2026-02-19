"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Working with Brewstamp has increased our customer loyalty. We love how easy it is to use and redeem free coffees.",
    name: "Jo",
    role: "Cafe owner",
    image: "/testimonial-jo.jpg",
  },
  {
    quote:
      "Our customers are stoked to join the paperless movement as part of their daily coffee routine.",
    name: "Isaac",
    role: "Bruns Beach Coffee Shop",
    image: "/testimonial-isaac.jpeg",
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-24">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Warm glow */}
      <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            What people say
          </h2>
        </div>

        <div className="relative mt-14 overflow-hidden" style={{ minHeight: 220 }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex flex-col items-center text-center transition-all duration-700 ease-in-out ${
                i === active
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0 pointer-events-none"
              }`}
            >
              <Quote className="mb-6 h-8 w-8 text-amber-500/30" />
              <blockquote className="max-w-2xl text-lg leading-relaxed text-stone-300 italic md:text-xl">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <Image
                  src={t.image}
                  alt={t.name}
                  width={44}
                  height={44}
                  className="rounded-full object-cover ring-2 ring-amber-500/30"
                />
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-stone-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? "w-6 bg-amber-500" : "w-2 bg-stone-600"
              }`}
              aria-label={`Show testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
