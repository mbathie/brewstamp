import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") || "Coffee Shop";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1917",
          fontFamily: "sans-serif",
        }}
      >
        {/* Coffee icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: "#d97706",
            marginBottom: 32,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            <line x1="6" x2="6" y1="2" y2="4" />
            <line x1="10" x2="10" y1="2" y2="4" />
            <line x1="14" x2="14" y1="2" y2="4" />
          </svg>
        </div>

        {/* Shop name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {shop}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#d97706",
            marginTop: 16,
            fontWeight: 600,
          }}
        >
          Loyalty Card
        </div>

        {/* Stamp dots */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: i < 5 ? "#d97706" : "#44403c",
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "#78716c",
          }}
        >
          Powered by Brewstamp
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
