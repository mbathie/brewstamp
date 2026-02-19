"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface LogoEditorProps {
  open: boolean;
  imageSrc: string;
  onSave: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function LogoEditor({
  open,
  imageSrc,
  onSave,
  onCancel,
}: LogoEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [ready, setReady] = useState(false);

  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when dialog opens with new image
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setReady(false);
    }
  }, [open, imageSrc]);

  // Compute "cover" dimensions: image sized to fill the 3:1 container
  function getCoverSize() {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !img.naturalWidth || !container) return null;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    return {
      w: img.naturalWidth * scale,
      h: img.naturalHeight * scale,
      cw,
      ch,
    };
  }

  function clampPan(px: number, py: number, z: number) {
    const cover = getCoverSize();
    if (!cover) return { x: px, y: py };
    const maxX = Math.max(0, (cover.w * z - cover.cw) / 2);
    const maxY = Math.max(0, (cover.h * z - cover.ch) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, px)),
      y: Math.min(maxY, Math.max(-maxY, py)),
    };
  }

  // Re-clamp pan when zoom changes
  useEffect(() => {
    const c = clampPan(panX, panY, zoom);
    if (c.x !== panX || c.y !== panY) {
      setPanX(c.x);
      setPanY(c.y);
    }
  }, [zoom]);

  function handleImageLoad() {
    setReady(true);
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setPanX((prev) => {
        const c = clampPan(prev + dx, panY + dy, zoom);
        return c.x;
      });
      setPanY((prev) => {
        const c = clampPan(panX + dx, prev + dy, zoom);
        return c.y;
      });
    },
    [zoom, panX, panY]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  function handleSave() {
    const img = imgRef.current;
    const cover = getCoverSize();
    if (!img || !cover) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 300;
    const ctx = canvas.getContext("2d")!;

    // Map the visible container viewport back to natural image coordinates.
    // In the preview, the image is: cover-sized, then scaled by zoom, then offset by pan.
    // Visible rect in "cover space" (before zoom):
    //   center of image is at center of container
    //   pan moves the image, so visible center shifts by -pan
    //   zoom scales from center, so visible extent is container / zoom
    const visibleW = cover.cw / zoom;
    const visibleH = cover.ch / zoom;
    const visibleCenterX = cover.w / 2 - panX / zoom;
    const visibleCenterY = cover.h / 2 - panY / zoom;

    // Convert from "cover space" to natural image coordinates
    const coverScale = Math.max(
      cover.cw / img.naturalWidth,
      cover.ch / img.naturalHeight
    );
    const srcX = (visibleCenterX - visibleW / 2) / coverScale;
    const srcY = (visibleCenterY - visibleH / 2) / coverScale;
    const srcW = visibleW / coverScale;
    const srcH = visibleH / coverScale;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, 900, 300);
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  }

  // Compute display styles from cover size
  const cover = getCoverSize();
  const imgStyle: React.CSSProperties = cover
    ? {
        width: cover.w,
        height: cover.h,
        left: "50%",
        top: "50%",
        transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom})`,
      }
    : {
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
      };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust Logo</DialogTitle>
        </DialogHeader>

        {/* Preview area */}
        <div
          ref={containerRef}
          className="relative aspect-[3/1] w-full cursor-grab overflow-hidden rounded-lg bg-muted active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ touchAction: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            draggable={false}
            onLoad={handleImageLoad}
            className="pointer-events-none absolute select-none"
            style={imgStyle}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="cursor-pointer">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
