"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Shuffle, AlertTriangle, Check, Loader2 } from "lucide-react";
import QrDisplay from "@/components/qr-display";
import LogoEditor from "@/components/logo-editor";
import CardPreview from "@/components/card-preview";
import ColorPicker from "@/components/ui/color-picker";
import PatternPicker from "@/components/ui/pattern-picker";
import { getColorHex, getContrastRatio } from "@/lib/tailwind-colors";
import { getRandomColorPair } from "@/lib/random-colors";

type SaveStatus = "idle" | "pending" | "saving" | "saved";

export default function SettingsPage() {
  const { data: session } = useSession();
  void session;
  const [shop, setShop] = useState<any>(null);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState<number | null>(8);
  const [logo, setLogo] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("stone-800");
  const [fgColor, setFgColor] = useState("amber-600");
  const [bgPattern, setBgPattern] = useState("none");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadRef = useRef(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((data) => {
        setShop(data.shop);
        setName(data.shop.name);
        setThreshold(data.shop.stampThreshold);
        setLogo(data.shop.logo || null);
        setBgColor(data.shop.bgColor || "stone-800");
        setFgColor(data.shop.fgColor || "amber-600");
        setBgPattern(data.shop.bgPattern || "none");
        // Skip the autosave effect that fires from this initial state hydration
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 0);
      });
  }, []);

  const saveChanges = useCallback(async () => {
    setSaveStatus("saving");
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
        }),
      });
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch {
      setSaveStatus("idle");
    }
  }, [name, threshold, bgColor, fgColor, bgPattern]);

  // Auto-save: debounced 3s after the last change to any tracked field.
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus("pending");
    autoSaveTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [name, threshold, bgColor, fgColor, bgPattern, saveChanges]);

  async function handleSaveClick() {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    await saveChanges();
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
          <CardHeader>
            <CardTitle className="text-lg">Customer Preview</CardTitle>
          </CardHeader>
          <CardContent>
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
              fitToParent
            >
              <div
                className="w-full rounded-md py-3 text-center text-base font-normal opacity-90"
                style={{
                  backgroundColor: getColorHex(fgColor),
                  color: getColorHex(bgColor),
                }}
              >
                Request Stamp
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
