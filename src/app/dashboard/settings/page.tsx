"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Shuffle, AlertTriangle, Check, Loader2, Store } from "lucide-react";
import QrDisplay from "@/components/qr-display";
import LogoEditor from "@/components/logo-editor";
import CardPreview from "@/components/card-preview";
import ColorPicker from "@/components/ui/color-picker";
import PatternPicker from "@/components/ui/pattern-picker";
import { getColorHex, getContrastRatio } from "@/lib/tailwind-colors";
import { getRandomColorPair } from "@/lib/random-colors";
import { patterns } from "@/lib/patterns";
import { LANGUAGE_META, SUPPORTED_LANGUAGES, resolveLanguage, t } from "@/lib/i18n";

type SaveStatus = "idle" | "pending" | "saving" | "saved";

export default function SettingsPage() {
  const { data: session } = useSession();
  void session;
  const [shop, setShop] = useState<any>(null);
  // True when the top-bar switcher is on "All shops" — there's no single shop
  // to edit, so we show a "pick a shop" prompt instead of the setup form.
  const [aggregate, setAggregate] = useState(false);
  const [pickerShops, setPickerShops] = useState<
    { shopId: string; shopName: string; role: string }[]
  >([]);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState<number | null>(8);
  const [logo, setLogo] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("stone-800");
  const [fgColor, setFgColor] = useState("amber-600");
  const [bgPattern, setBgPattern] = useState("none");
  const [language, setLanguage] = useState<string>("en");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((data) => {
        if (data.aggregate) {
          setAggregate(true);
          setPickerShops(data.shops || []);
          return;
        }
        if (!data.shop) return;
        setShop(data.shop);
        const initial = {
          name: data.shop.name ?? "",
          threshold: data.shop.stampThreshold ?? 8,
          bgColor: data.shop.bgColor || "stone-800",
          fgColor: data.shop.fgColor || "amber-600",
          bgPattern: data.shop.bgPattern || "none",
          language: resolveLanguage(data.shop.language),
        };
        setName(initial.name);
        setThreshold(initial.threshold);
        setLogo(data.shop.logo || null);
        setBgColor(initial.bgColor);
        setFgColor(initial.fgColor);
        setBgPattern(initial.bgPattern);
        setLanguage(initial.language);
        lastSavedRef.current = JSON.stringify(initial);
      });
  }, []);

  const saveChanges = useCallback(async () => {
    setSaveStatus("saving");
    const snapshot = JSON.stringify({
      name,
      threshold,
      bgColor,
      fgColor,
      bgPattern,
      language,
    });
    try {
      await fetch("/api/shop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          stampThreshold: threshold || 8,
          bgColor,
          fgColor,
          bgPattern,
          language,
        }),
      });
      lastSavedRef.current = snapshot;
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch {
      setSaveStatus("idle");
    }
  }, [name, threshold, bgColor, fgColor, bgPattern, language]);

  // Auto-save: debounced 3s after a real change (current state differs from last saved snapshot).
  useEffect(() => {
    if (lastSavedRef.current === null) return; // not hydrated yet
    const current = JSON.stringify({
      name,
      threshold,
      bgColor,
      fgColor,
      bgPattern,
      language,
    });
    if (current === lastSavedRef.current) return; // nothing changed
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus("pending");
    autoSaveTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [name, threshold, bgColor, fgColor, bgPattern, language, saveChanges]);

  async function handleSaveClick() {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await saveChanges();
  }

  // From the "All shops" empty state, drop into a single shop's setup: set the
  // active-shop cookie, then reload so the whole dashboard (sidebar, top bar,
  // this page) re-scopes to the chosen shop.
  async function switchToShop(shopId: string) {
    setSwitchingTo(shopId);
    try {
      const res = await fetch("/api/shop-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: shopId }),
      });
      if (!res.ok) {
        setSwitchingTo(null);
        return;
      }
      window.location.reload();
    } catch {
      setSwitchingTo(null);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImage(reader.result as string);
      setEditorOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  async function handleEditorSave(croppedUrl: string) {
    setEditorOpen(false);
    setRawImage(null);
    setUploadingLogo(true);
    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo: croppedUrl }),
    });
    if (res.ok) setLogo(croppedUrl);
    setUploadingLogo(false);
  }

  function handleEditorCancel() {
    setEditorOpen(false);
    setRawImage(null);
  }

  async function handleLogoRemove() {
    setUploadingLogo(true);
    const res = await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo: null }),
    });
    if (res.ok) setLogo(null);
    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (aggregate) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Shop Setup</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Store className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Pick a shop to edit
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              You&apos;re viewing <strong>All shops</strong>. Shop setup —
              branding, loyalty, and card design — applies to one shop at a
              time. Choose a shop below to edit its setup.
            </p>

            {pickerShops.length > 0 && (
              <div className="mt-4 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {pickerShops.map((s) => (
                  <button
                    key={s.shopId}
                    type="button"
                    disabled={!!switchingTo}
                    onClick={() => switchToShop(s.shopId)}
                    className="group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-amber-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground/80">
                      {switchingTo === s.shopId ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Store className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">
                        {s.shopName}
                      </div>
                      <div className="text-sm capitalize text-muted-foreground">
                        {s.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const previewThreshold = threshold ?? 8;
  // Demo state for the preview: half-full card to show the visual
  const previewStamps = Math.max(1, Math.floor(previewThreshold / 2));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Shop Setup</h1>
          <SaveIndicator status={saveStatus} />
        </div>
        <QrDisplay
          shopCode={shop.code}
          shopName={name}
          shopLogo={logo}
          stampThreshold={threshold ?? undefined}
          bgColor={bgColor}
          fgColor={fgColor}
          bgPattern={bgPattern}
          language={language}
          variant="compact"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT: all the controls */}
        <Card>
          <CardContent className="space-y-8 p-6">
            {/* Branding */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Branding</h2>
              <div className="space-y-2">
                <Label>Brand Logo</Label>
                <div
                  onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                  className="group relative h-16 w-48 cursor-pointer overflow-hidden rounded-lg"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  {logo ? (
                    <>
                      <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-700 text-sm text-muted-foreground transition-colors group-hover:border-stone-500 group-hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      Click to upload
                    </div>
                  )}
                </div>
                {logo && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleLogoRemove}
                    className="cursor-pointer"
                  >
                    Delete
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </section>

            {/* Loyalty */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Loyalty</h2>
              <div className="space-y-2">
                <Label htmlFor="threshold">Stamps for a free reward</Label>
                <NumberInput
                  id="threshold"
                  min={1}
                  max={20}
                  value={threshold}
                  onChange={(v) => setThreshold(v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Customer-facing language</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {SUPPORTED_LANGUAGES.map((code) => {
                    const meta = LANGUAGE_META[code];
                    return (
                      <option key={code} value={code}>
                        {meta.flag} {meta.nativeName} ({meta.englishName})
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-muted-foreground">
                  Applies to your customer&apos;s loyalty card and the printed QR PDF. Your dashboard stays in English.
                </p>
              </div>
            </section>

            {/* Card Design */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Card Design</h2>
                <button
                  type="button"
                  onClick={() => {
                    const { bgColor: bg, fgColor: fg } = getRandomColorPair();
                    setBgColor(bg);
                    setFgColor(fg);
                    const pick = patterns[Math.floor(Math.random() * patterns.length)];
                    setBgPattern(pick.key);
                  }}
                  className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Shuffle className="h-3 w-3" />
                  Randomize
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Background</Label>
                <ColorPicker value={bgColor} onChange={setBgColor} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Foreground</Label>
                <ColorPicker value={fgColor} onChange={setFgColor} />
              </div>
              <ContrastWarning bg={bgColor} fg={fgColor} />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Background Pattern</Label>
                <PatternPicker
                  value={bgPattern}
                  onChange={setBgPattern}
                  previewColor={getColorHex(fgColor)}
                  previewBg={getColorHex(bgColor)}
                />
              </div>
            </section>

            <Button
              onClick={handleSaveClick}
              disabled={saveStatus === "saving"}
              className="cursor-pointer"
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved!"
                  : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: live preview */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">Customer Preview</h2>
            <CardPreview
              shopName={name || "Your Shop"}
              shopLogo={logo}
              stamps={previewStamps}
              threshold={previewThreshold}
              totalEarned={previewStamps + previewThreshold * 2}
              freeRedeemed={2}
              bgColor={bgColor}
              fgColor={fgColor}
              bgPattern={bgPattern}
              displayName="Sam"
              language={language}
              fitToParent
            >
              <div
                className="w-full rounded-md py-3 text-center text-base font-normal opacity-90"
                style={{
                  backgroundColor: getColorHex(fgColor),
                  color: getColorHex(bgColor),
                }}
              >
                {t(language, "requestStamp")}
              </div>
            </CardPreview>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Showing demo state — your customers will see real stamp counts.
            </p>
          </CardContent>
        </Card>
      </div>

      {rawImage && (
        <LogoEditor
          open={editorOpen}
          imageSrc={rawImage}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "pending")
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-600">
      <Check className="h-3 w-3" />
      Saved
    </span>
  );
}

function ContrastWarning({ bg, fg }: { bg: string; fg: string }) {
  const ratio = getContrastRatio(getColorHex(bg), getColorHex(fg));
  if (ratio < 1.5)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
        <AlertTriangle className="size-4 shrink-0" />
        These colors are too similar — text will be invisible.
      </div>
    );
  if (ratio < 3)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
        <AlertTriangle className="size-4 shrink-0" />
        Low contrast — text may be hard to read.
      </div>
    );
  return null;
}
