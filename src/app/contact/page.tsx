"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send,
  Loader2,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

// Light, explicitly-styled field — the shared shadcn Input/Textarea pull the
// dark dashboard theme tokens, which render grey/black on these public pages.
const FIELD =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-[15px] text-stone-900 placeholder:text-stone-400 shadow-sm transition focus:border-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-600/15";

function FieldLabel({
  htmlFor,
  children,
  required,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-stone-700"
    >
      {children}
      {required && <span className="ml-0.5 text-amber-600">*</span>}
      {optional && (
        <span className="ml-1.5 text-xs font-normal text-stone-400">
          optional
        </span>
      )}
    </label>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send message");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <PublicHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-20">
        {/* Heading */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            <MessageSquare className="size-3.5" />
            We usually reply within a day
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-900">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-md text-stone-500">
            A question, some feedback, or want a hand setting up your loyalty
            card? We&apos;d love to hear from you.
          </p>
        </div>

        {isSubmitted ? (
          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100">
              <CheckCircle2 className="size-7 text-amber-700" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-stone-900">
              Message sent
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-stone-500">
              Thanks for reaching out — we&apos;ll get back to you at the email
              you gave us as soon as we can.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-800"
            >
              Back to home
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="name" optional>
                    Name
                  </FieldLabel>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className={FIELD}
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="email" required>
                    Email
                  </FieldLabel>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={FIELD}
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="message" required>
                  Message
                </FieldLabel>
                <textarea
                  id="message"
                  required
                  placeholder="How can we help?"
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className={`${FIELD} resize-none`}
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 px-5 py-3 text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Send message
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {!isSubmitted && (
          <p className="mt-6 text-center text-sm text-stone-500">
            Prefer email? Reach us directly at{" "}
            <a
              href="mailto:hello@brewstamp.app"
              className="font-medium text-amber-700 underline-offset-2 hover:underline"
            >
              hello@brewstamp.app
            </a>
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}
