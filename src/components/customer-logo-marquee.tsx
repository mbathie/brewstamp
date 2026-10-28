// The "Trusted by cafes" logo strip on the homepage: two rows drifting in
// opposite directions, paused on hover, and a static wrapped grid for
// visitors who prefer reduced motion (see .logo-marquee in globals.css).
// Pure CSS, so it renders on the server with no client JS.
//
// Customers are listed with their permission. Logos are exported from the
// shop's uploaded logo into public/customers; a shop without one gets its
// name set as a wordmark. `country` feeds the "N countries" headline.

export interface CustomerLogo {
  name: string;
  place: string;
  country: string;
  logo?: string;
  // Square or transparent logos need breathing room inside the 3:1 tile;
  // the 3:1 banners uploaded through the dashboard fill it edge to edge.
  padded?: boolean;
  logoClass?: string;
}

const ROW_A: CustomerLogo[] = [
  { name: "Thirty 7even", place: "Macquarie Park, Sydney", country: "AU", logo: "/customers/thirty-7even.png", padded: true, logoClass: "invert" },
  { name: "The Donut Destination", place: "Christchurch, New Zealand", country: "NZ", logo: "/customers/the-donut-destination.webp" },
  { name: "Pedal Cafe", place: "Metro Manila, Philippines", country: "PH", logo: "/customers/pedal-cafe.webp" },
  { name: "Bennett St Dairy", place: "Bondi, Sydney", country: "AU", logo: "/customers/bennett-st-dairy.jpg", padded: true },
  { name: "EZPZ Lemon Squeezy", place: "Las Vegas, USA", country: "US", logo: "/customers/ezpz-lemon-squeezy.webp" },
  { name: "Coffee & Crust", place: "United Kingdom", country: "UK", logo: "/customers/coffee-and-crust.webp" },
  { name: "Short Stop Coffee", place: "Melbourne & Sydney", country: "AU", logo: "/customers/short-stop-coffee.png", padded: true },
  { name: "Hasan's Café", place: "Saudi Arabia", country: "SA" },
  { name: "Haus Social", place: "Melbourne", country: "AU", logo: "/customers/haus-social.webp" },
  { name: "Little Yokozuna +cafe", place: "Guam", country: "US", logo: "/customers/little-yokozuna.webp" },
  { name: "Hearthside", place: "Potts Point, Sydney", country: "AU", logo: "/customers/hearthside.webp" },
];

const ROW_B: CustomerLogo[] = [
  { name: "Tamping Ground", place: "Sutherland Shire, Sydney", country: "AU", logo: "/customers/tamping-ground.png", padded: true },
  { name: "Xoco House", place: "United States", country: "US", logo: "/customers/xoco-house.webp" },
  { name: "The Coffee Lounge", place: "Woolwich, London", country: "UK", logo: "/customers/the-coffee-lounge.webp" },
  { name: "Eliam Coffee", place: "Australia", country: "AU", logo: "/customers/eliam-coffee.webp" },
  { name: "Hampstead Rehab Centre Kiosk", place: "Adelaide", country: "AU", logo: "/customers/hampstead-kiosk.webp" },
  { name: "Baked since 95", place: "Hillside, Melbourne", country: "AU", logo: "/customers/baked-since-95.jpg", padded: true },
  { name: "Handy + Hot", place: "United States", country: "US", logo: "/customers/handy-and-hot.webp" },
  { name: "Fantong", place: "Australia", country: "AU", logo: "/customers/fantong.webp" },
  { name: "Perry's Social Club", place: "Keilor East, Melbourne", country: "AU", logo: "/customers/perrys-social-club.webp" },
  { name: "Brown Sugar Bakery", place: "Forresters Beach, NSW", country: "AU", logo: "/customers/brown-sugar-bakery.png", padded: true },
];

export const CUSTOMER_COUNTRIES = new Set([...ROW_A, ...ROW_B].map((c) => c.country)).size;

function Tile({ c, dup }: { c: CustomerLogo; dup?: boolean }) {
  return (
    <li className="logo-marquee-item mr-4 w-44 shrink-0 sm:w-56" data-dup={dup || undefined} aria-hidden={dup || undefined}>
      <div className="flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
        {c.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.logo}
            alt={dup ? "" : `${c.name} logo`}
            loading="lazy"
            className={`h-full w-full object-contain ${c.padded ? "p-2" : ""} ${c.logoClass ?? ""}`}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-stone-100 px-3 text-center font-serif text-lg font-semibold leading-tight text-stone-800">
            {c.name}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-center text-sm font-semibold text-stone-900">{c.name}</p>
      <p className="truncate text-center text-xs text-stone-500">{c.place}</p>
    </li>
  );
}

function Row({ items, reverse, seconds }: { items: CustomerLogo[]; reverse?: boolean; seconds: number }) {
  // Two copies side by side; the track slides by exactly one copy (-50%) and
  // loops seamlessly. The copy is hidden from screen readers.
  return (
    <div className="logo-marquee">
      <ul
        className="logo-marquee-track"
        data-reverse={reverse || undefined}
        style={{ animationDuration: `${seconds}s` }}
      >
        {items.map((c) => <Tile key={c.name} c={c} />)}
        {items.map((c) => <Tile key={`dup-${c.name}`} c={c} dup />)}
      </ul>
    </div>
  );
}

export default function CustomerLogoMarquee() {
  return (
    <div className="space-y-6">
      <Row items={ROW_A} seconds={70} />
      <Row items={ROW_B} reverse seconds={80} />
    </div>
  );
}
