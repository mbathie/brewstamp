"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Upload,
  Shuffle,
  AlertTriangle,
  Check,
  Loader2,
  Store,
  Lock,
  HelpCircle,
  ChevronsUpDown,
} from "lucide-react";
import QrDisplay from "@/components/qr-display";
import LogoEditor from "@/components/logo-editor";
import CardPreview from "@/components/card-preview";
import PerkCardPreview from "@/components/perk-card-preview";
import ColorPicker from "@/components/ui/color-picker";
import PatternPicker from "@/components/ui/pattern-picker";
import { getColorHex, getContrastRatio } from "@/lib/tailwind-colors";
import { getRandomColorPair } from "@/lib/random-colors";
import { patterns } from "@/lib/patterns";
import {
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  resolveLanguage,
  t,
} from "@/lib/i18n";

type SaveStatus = "idle" | "pending" | "saving" | "saved";

// The merchant's own timezone, used as the default for a perk shop that hasn't
// picked one yet. Called client-side (in the fetch hydration) so it reflects
// the browser, not the server.
function getBrowserTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// Full IANA timezone list for the perk-mode daily-reset picker. Uses the
// runtime's own list when available (modern browsers + Node 20), falling back
// to a small common set. Computed once at module load.
const TIMEZONES: string[] = (() => {
  try {
    const zones = (
      Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
    ).supportedValuesOf?.("timeZone");
    if (Array.isArray(zones) && zones.length) {
      return zones.includes("UTC") ? zones : ["UTC", ...zones];
    }
  } catch {
    // fall through to the static list
  }
  return [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Toronto",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Africa/Johannesburg",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];
})();

export default function SettingsPage() {
  const { data: session } = useSession();
  void session;
  const router = useRouter();
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
  // Corporate "perk" mode — employer-subsidised coffee.
  const [perkMode, setPerkMode] = useState(false);
  const [perkDomains, setPerkDomains] = useState(""); // comma/space separated
  const [dailyDrinkLimit, setDailyDrinkLimit] = useState<number | null>(2);
  const [timezone, setTimezone] = useState("UTC");
  // Whether the shop's plan (Plus/Max) unlocks corporate perk mode.
  const [canUsePerkMode, setCanUsePerkMode] = useState(false);
  // The shop already has loyalty/perk history — switching program type strands
  // it, so we warn before applying. `pendingMode` holds the target while the
  // confirmation modal is open.
  const [hasActivity, setHasActivity] = useState(false);
  const [pendingMode, setPendingMode] = useState<boolean | null>(null);
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
        setCanUsePerkMode(!!data.canUsePerkMode);
        setHasActivity(!!data.hasActivity);
        const initial = {
          name: data.shop.name ?? "",
          threshold: data.shop.stampThreshold ?? 8,
          bgColor: data.shop.bgColor || "stone-800",
          fgColor: data.shop.fgColor || "amber-600",
          bgPattern: data.shop.bgPattern || "none",
          language: resolveLanguage(data.shop.language),
          perkMode: !!data.shop.perkMode,
          perkDomains: (data.shop.allowedEmailDomains || []).join(", "),
          dailyDrinkLimit: data.shop.dailyDrinkLimit ?? 2,
          // No saved timezone yet → default to the merchant's browser zone.
          timezone: data.shop.timezone || getBrowserTz(),
        };
        setName(initial.name);
        setThreshold(initial.threshold);
        setLogo(data.shop.logo || null);
        setBgColor(initial.bgColor);
        setFgColor(initial.fgColor);
        setBgPattern(initial.bgPattern);
        setLanguage(initial.language);
        setPerkMode(initial.perkMode);
        setPerkDomains(initial.perkDomains);
        setDailyDrinkLimit(initial.dailyDrinkLimit);
        setTimezone(initial.timezone);
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
      perkMode,
      perkDomains,
      dailyDrinkLimit,
      timezone,
    });
    const allowedEmailDomains = perkDomains
      .split(/[\s,;]+/)
      .map((d) => d.trim().toLowerCase().replace(/^@+/, ""))
      .filter(Boolean);
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
          perkMode,
          allowedEmailDomains,
          dailyDrinkLimit: dailyDrinkLimit || 2,
          timezone,
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
  }, [
    name,
    threshold,
    bgColor,
    fgColor,
    bgPattern,
    language,
    perkMode,
    perkDomains,
    dailyDrinkLimit,
    timezone,
  ]);

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
      perkMode,
      perkDomains,
      dailyDrinkLimit,
      timezone,
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
  }, [
    name,
    threshold,
    bgColor,
    fgColor,
    bgPattern,
    language,
    perkMode,
    perkDomains,
    dailyDrinkLimit,
    timezone,
    saveChanges,
  ]);

  async function handleSaveClick() {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await saveChanges();
  }

  // Tapping a program-type tab. If it's a real change AND the shop already has
  // history, warn first (switching strands the existing data); otherwise apply
  // straight away.
  function requestModeChange(target: boolean) {
    if (target === perkMode) return;
    if (hasActivity) {
      setPendingMode(target);
    } else {
      setPerkMode(target);
    }
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
          perkMode={perkMode}
          dailyDrinkLimit={dailyDrinkLimit ?? undefined}
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
            {/* Branding + Loyalty — laid out 2-up so the block stays compact
                without shrinking the individual controls. */}
            <section className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">
                Branding
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                <div className="space-y-2">
                  <Label>Brand Logo</Label>
                  <div
                    onClick={() =>
                      !uploadingLogo && fileInputRef.current?.click()
                    }
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
                        <img
                          src={logo}
                          alt="Logo"
                          className="h-full w-full object-cover"
                        />
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
              </div>
            </section>

            {/* Program — stamp card vs corporate perk. A segmented control
                drives both the fields below and the right-hand preview, so the
                two mutually-exclusive modes read as one deliberate choice
                instead of fields appearing and disappearing. */}
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Program
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  How customers earn at this shop.
                </p>
              </div>

              <div className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => requestModeChange(false)}
                  className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    !perkMode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Stamp card
                </button>
                {canUsePerkMode ? (
                  <button
                    type="button"
                    onClick={() => requestModeChange(true)}
                    className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      perkMode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Corporate perk
                  </button>
                ) : (
                  /* Locked on Free & Pro — looks disabled, but clicking takes
                     you to billing to upgrade. */
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/billing")}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        Corporate perk
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-center">
                      Corporate perk mode is on the Plus and Max plans. Click to
                      upgrade.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Mode-specific fields live in one bordered panel so switching
                  modes changes the panel's contents, not the page layout. */}
              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                {!perkMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Stamps for a free reward</Label>
                    <NumberInput
                      id="threshold"
                      min={1}
                      max={20}
                      value={threshold}
                      onChange={(v) => setThreshold(v)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Customers collect this many stamps, then earn a free
                      drink.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Every scan is a free drink (no stamps) — for
                        employer-subsidised staff coffee. Limited to staff email
                        domains and capped per person per day.
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                            How it works
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              How corporate perk mode works
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 text-sm text-muted-foreground">
                            <p>
                              Perk mode turns this shop into an employer-paid
                              coffee program at a cafe of your choice. There are
                              no stamps — every approved scan is one free drink.
                            </p>
                            <ol className="list-decimal space-y-2 pl-5">
                              <li>
                                Set your staff{" "}
                                <strong className="text-foreground">
                                  email domains
                                </strong>{" "}
                                (e.g. mycompany.com) and a{" "}
                                <strong className="text-foreground">
                                  daily limit
                                </strong>{" "}
                                per person.
                              </li>
                              <li>
                                Print the QR code and place it at the cafe
                                counter. The barista needs a device (phone or
                                iPad) signed in to approve drinks.
                              </li>
                              <li>
                                A staff member scans the QR and enters their
                                work email once — no app, no password. It&apos;s
                                remembered on their phone after that.
                              </li>
                              <li>
                                Each scan asks the barista to approve a free
                                coffee, up to the daily limit. Emails outside
                                your domains are turned away.
                              </li>
                              <li>
                                To reimburse the cafe, download the{" "}
                                <strong className="text-foreground">CSV</strong>{" "}
                                any time — it lists free drinks redeemed per
                                employee so you can tally what you owe.
                              </li>
                            </ol>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="perkDomains">Allowed email domains</Label>
                      <Input
                        id="perkDomains"
                        value={perkDomains}
                        onChange={(e) => setPerkDomains(e.target.value)}
                        placeholder="mycompany.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated. Only emails at these domains can claim
                        a free coffee.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
                      <div className="space-y-2">
                        <Label htmlFor="dailyDrinkLimit">
                          Free drinks per day
                        </Label>
                        <NumberInput
                          id="dailyDrinkLimit"
                          min={1}
                          max={20}
                          value={dailyDrinkLimit}
                          onChange={(v) => setDailyDrinkLimit(v)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone (daily reset)</Label>
                        <TimezoneCombobox
                          value={timezone}
                          onChange={setTimezone}
                        />
                        <p className="text-xs text-muted-foreground">
                          When the daily limit resets.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Language applies to both modes, so it stays put. */}
              <div className="space-y-2">
                <Label htmlFor="language">Customer-facing language</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-1/2"
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
                  Applies to the customer card and the printed QR PDF.
                </p>
              </div>
            </section>

            {/* Card Design */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Card Design
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const { bgColor: bg, fgColor: fg } = getRandomColorPair();
                    setBgColor(bg);
                    setFgColor(fg);
                    const pick =
                      patterns[Math.floor(Math.random() * patterns.length)];
                    setBgPattern(pick.key);
                  }}
                  className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Shuffle className="h-3 w-3" />
                  Randomize
                </button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Background
                </Label>
                <ColorPicker value={bgColor} onChange={setBgColor} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Foreground
                </Label>
                <ColorPicker value={fgColor} onChange={setFgColor} />
              </div>
              <ContrastWarning bg={bgColor} fg={fgColor} />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Background Pattern
                </Label>
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

        {/* RIGHT: live preview. Sticks to the top of the viewport as the left
            column scrolls, so the whole card stays visible even when reaching
            the colour/pattern pickers far down the page. self-start stops the
            grid from stretching it to the left column's full height (which
            would leave no room to stick). */}
        <Card className="self-start md:sticky md:top-20">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">
              Customer Preview
            </h2>
            {perkMode ? (
              <PerkCardPreview
                shopName={name || "Your Shop"}
                shopLogo={logo}
                bgColor={bgColor}
                fgColor={fgColor}
                bgPattern={bgPattern}
                dailyLimit={dailyDrinkLimit ?? 2}
              />
            ) : (
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
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {perkMode
                ? "Staff scan, pick up a free coffee, and the barista approves — capped at your daily limit."
                : "Showing demo state — your customers will see real stamp counts."}
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

      {/* Switching program type on a shop that already has history strands the
          existing data — warn and steer toward a separate shop. */}
      <Dialog
        open={pendingMode !== null}
        onOpenChange={(open) => {
          if (!open) setPendingMode(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Switch this shop to{" "}
              {pendingMode ? "Corporate perk" : "Stamp card"}?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{name || "This shop"}</strong>{" "}
              already has {pendingMode ? "stamp/loyalty" : "perk"} activity.
              Switching the program type doesn&apos;t move that data across — it
              stays on the shop but gets stranded:
            </p>
            {pendingMode ? (
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Existing customers&apos; stamps become invisible and
                  can&apos;t be redeemed.
                </li>
                <li>
                  The card locks to your work-email domains — public customers
                  can no longer take part.
                </li>
                <li>
                  Reports &amp; the reimbursement CSV mix old loyalty
                  redemptions in with free coffees.
                </li>
              </ul>
            ) : (
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Staff free-coffee history stays but gets reported as stamps.
                </li>
                <li>The email-domain gate and daily cap stop applying.</li>
              </ul>
            )}
            <p>
              We recommend running the new program as a{" "}
              <strong className="text-foreground">separate shop</strong> — it
              keeps each program&apos;s data, QR code, and reporting clean.
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push("/dashboard/shops/new")}
              className="w-full cursor-pointer"
            >
              Create a new shop instead
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPendingMode(null)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (pendingMode !== null) setPerkMode(pendingMode);
                  setPendingMode(null);
                }}
                className="flex-1 cursor-pointer"
              >
                Switch anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Typeahead picker for the perk-mode daily-reset timezone. cmdk filters as you
// type; each item carries a space-separated alias ("Australia/Sydney" →
// "Australia Sydney") so searches like "sydney" or "new york" match.
function TimezoneCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="truncate">{value || "Select timezone"}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search city or zone…" />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
              {TIMEZONES.map((tz) => (
                <CommandItem
                  key={tz}
                  value={`${tz} ${tz.replace(/[/_]/g, " ")}`}
                  onSelect={() => {
                    onChange(tz);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={`mr-2 size-4 ${
                      value === tz ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {tz}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
