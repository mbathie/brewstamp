"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, Upload, Shuffle } from "lucide-react";
import QrDisplay from "@/components/qr-display";
import LogoEditor from "@/components/logo-editor";
import ColorPicker from "@/components/ui/color-picker";
import PatternPicker from "@/components/ui/pattern-picker";
import { getColorHex } from "@/lib/tailwind-colors";
import { getRandomColorPair } from "@/lib/random-colors";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [shop, setShop] = useState<any>(null);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState<number | null>(8);
  const [logo, setLogo] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("stone-800");
  const [fgColor, setFgColor] = useState("amber-600");
  const [bgPattern, setBgPattern] = useState("none");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    await fetch("/api/shop", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, stampThreshold: threshold || 8, bgColor, fgColor, bgPattern }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

    if (res.ok) {
      setLogo(croppedUrl);
    }
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

    if (res.ok) {
      setLogo(null);
    }
    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!shop) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <img
                    src={logo}
                    alt="Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: getColorHex(fgColor) }}
                  >
                    <Coffee className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Upload className="h-5 w-5 text-white" />
                </div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Colors</Label>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Background</Label>
                  <ColorPicker value={bgColor} onChange={setBgColor} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Foreground</Label>
                  <ColorPicker value={fgColor} onChange={setFgColor} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background Pattern</Label>
              <PatternPicker
                value={bgPattern}
                onChange={setBgPattern}
                previewColor={getColorHex(fgColor)}
                previewBg={getColorHex(bgColor)}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="cursor-pointer"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code & Loyalty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Stamps for a free drink</Label>
              <NumberInput
                id="threshold"
                min={1}
                max={20}
                value={threshold}
                onChange={(v) => setThreshold(v)}
              />
            </div>
            <QrDisplay shopCode={shop.code} shopName={name} shopLogo={logo} stampThreshold={threshold} bgColor={bgColor} fgColor={fgColor} bgPattern={bgPattern} />
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
