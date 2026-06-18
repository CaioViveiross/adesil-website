'use client';

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCw, RotateCcw } from "lucide-react";

// ─── Canvas utility ───────────────────────────────────────────────────────────

interface PixelCrop { x: number; y: number; width: number; height: number }

function toRad(deg: number) { return (deg * Math.PI) / 180; }

function rotatedSize(w: number, h: number, rotation: number) {
  const rad = toRad(rotation);
  return {
    width:  Math.abs(Math.cos(rad)) * w + Math.abs(Math.sin(rad)) * h,
    height: Math.abs(Math.sin(rad)) * w + Math.abs(Math.cos(rad)) * h,
  };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

async function getCroppedBlob(
  src: string,
  pixelCrop: PixelCrop,
  rotation = 0,
): Promise<Blob> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const { width: bw, height: bh } = rotatedSize(image.width, image.height, rotation);
  canvas.width  = bw;
  canvas.height = bh;

  ctx.translate(bw / 2, bh / 2);
  ctx.rotate(toRad(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((res, rej) =>
    canvas.toBlob(
      (blob) => (blob ? res(blob) : rej(new Error("canvas vazio"))),
      "image/jpeg",
      0.92,
    )
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropModal({ open, imageSrc, aspect = 1, onConfirm, onCancel }: Props) {
  const [crop,               setCrop]               = useState({ x: 0, y: 0 });
  const [zoom,               setZoom]               = useState(1);
  const [rotation,           setRotation]           = useState(0);
  const [croppedAreaPixels,  setCroppedAreaPixels]  = useState<PixelCrop | null>(null);
  const [processing,         setProcessing]         = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: PixelCrop) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels, rotation);
      onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    onCancel();
  };

  const rotate = (deg: number) =>
    setRotation((r) => (r + deg + 360) % 360);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="text-base">Ajustar imagem</DialogTitle>
        </DialogHeader>

        {/* Cropper area */}
        <div className="relative w-full bg-zinc-900" style={{ height: 300 }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { borderRadius: 0 },
                cropAreaStyle: { borderRadius: 8 },
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 py-4 space-y-4 border-t">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
            <Slider
              min={1} max={3} step={0.01}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {zoom.toFixed(1)}×
            </span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => rotate(-90)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Girar 90° anti-horário"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </button>
            <Slider
              min={0} max={360} step={1}
              value={[rotation]}
              onValueChange={([v]) => setRotation(v)}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => rotate(90)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Girar 90° horário"
            >
              <RotateCw className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
              {rotation}°
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 pb-5">
          <Button variant="outline" onClick={handleCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing}>
            {processing ? "Processando…" : "Confirmar recorte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
