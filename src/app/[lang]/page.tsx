import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  QrCode,
  Smartphone,
  Zap,
  Globe,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";
import { LANDING_COPY, LANDING_LANGS, buildHreflangMap } from "@/lib/i18n/landing";
import { LANGUAGE_META } from "@/lib/i18n";

export const dynamicParams = false;

export async function generateStaticParams() {
  return LANDING_LANGS.map((lang) => ({ lang }));
}

interface RouteParams {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata(
  { params }: RouteParams,
): Promise<Metadata> {
  const { lang } = await params;
  const copy = LANDING_COPY[lang];
  if (!copy) return {};
  const meta = LANGUAGE_META[lang as keyof typeof LANGUAGE_META];
  return {
    title: { absolute: copy.metaTitle },
    description: copy.metaDescription,
    alternates: {
      canonical: `/${lang}`,
      languages: buildHreflangMap(),
    },
    openGraph: {
      type: "website",
      url: `/${lang}`,
      title: copy.metaTitle,
      description: copy.metaDescription,
      locale: lang,
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    other: meta?.rtl ? { "content-language": lang } : undefined,
  };
}

export default async function LandingPage({ params }: RouteParams) {
  const { lang } = await params;
  const copy = LANDING_COPY[lang];
  if (!copy) notFound();
  const meta = LANGUAGE_META[lang as keyof typeof LANGUAGE_META];
  const isRtl = !!meta?.rtl;

  const benefits = [
    { icon: Smartphone, title: copy.benefit1Title, body: copy.benefit1Body },
    { icon: Zap, title: copy.benefit2Title, body: copy.benefit2Body },
    { icon: QrCode, title: copy.benefit3Title, body: copy.benefit3Body },
  ];

  const steps = [
    { title: copy.step1Title, body: copy.step1Body },
    { title: copy.step2Title, body: copy.step2Body },
    { title: copy.step3Title, body: copy.step3Body },
  ];

  return (
    <div
      className="flex min-h-screen flex-col bg-stone-50"
      lang={lang}
      dir={isRtl ? "rtl" : undefined}
    >
      <PublicHeader transparent />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative min-h-[80vh] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=70&auto=format&fit=crop"
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/85 via-stone-900/75 to-stone-900/90" />
          <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-200 backdrop-blur-sm">
              <span aria-hidden>{meta?.flag}</span>
              {meta?.nativeName}
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-200 md:text-xl">
              {copy.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                >
                  {copy.ctaPrimary}
                  <ArrowRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                </Button>
              </Link>
              <Link href="/try">
                <Button
                  size="lg"
                  variant="outline"
                  className="cursor-pointer border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  {copy.ctaSecondary}
                </Button>
              </Link>
            </div>
            <p className="mx-auto mt-10 inline-flex max-w-xl items-start gap-2 rounded-xl border border-white/15 bg-stone-900/70 px-5 py-3 text-sm leading-relaxed text-white backdrop-blur-md">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
              <span>{copy.dashboardNote}</span>
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-b border-stone-200 bg-stone-50 py-20">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-200 bg-white p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <Icon className="h-5 w-5 text-amber-700" aria-hidden />
                </div>
                <h2 className="mt-5 text-lg font-bold text-stone-900">
                  {title}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-stone-600">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-stone-200 bg-white py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
              {copy.howItWorksTitle}
            </h2>
            <ol className="mt-12 space-y-6">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-5 rounded-2xl border border-stone-200 bg-stone-50 p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-base font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-base leading-relaxed text-stone-600">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-stone-50 py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div className="rounded-2xl border border-stone-200 bg-white p-10">
              <h2 className="text-2xl font-bold text-stone-900 md:text-3xl">
                {copy.finalCtaTitle}
              </h2>
              <p className="mt-3 text-stone-500">{copy.finalCtaSubtitle}</p>
              <div className="mt-8">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="cursor-pointer bg-amber-700 px-8 text-base hover:bg-amber-800"
                  >
                    {copy.finalCtaButton}
                    <ArrowRight className={`h-4 w-4 ${isRtl ? "mr-2 rotate-180" : "ml-2"}`} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
