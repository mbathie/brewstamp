"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PublicHeader from "@/components/public-header";
import Footer from "@/components/footer";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-4 h-16 w-16 text-amber-600" />
            <h1 className="text-2xl font-bold text-stone-900">Message Sent!</h1>
            <p className="mt-2 text-stone-500">
              Thanks for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <Link href="/">
              <Button className="mt-6 cursor-pointer bg-amber-600 hover:bg-amber-700">
                Back to Home
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-stone-900">Contact Us</h1>
            <p className="mt-2 text-sm text-stone-500">
              Have a question or feedback? We&apos;d love to hear from you.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-lg space-y-5">
              <div>
                <Label htmlFor="name" className="text-stone-700">
                  Name <span className="text-stone-400">(optional)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-stone-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-stone-700">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  required
                  placeholder="How can we help you?"
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="mt-1.5 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer bg-amber-600 hover:bg-amber-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-sm text-stone-400">
              You can also email us directly at{" "}
              <a
                href="mailto:hello@brewstamp.app"
                className="text-amber-600 hover:text-amber-700"
              >
                hello@brewstamp.app
              </a>
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
