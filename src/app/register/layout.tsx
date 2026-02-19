import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description:
    "Create your free Brewstamp account and set up a digital loyalty card for your coffee shop.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
