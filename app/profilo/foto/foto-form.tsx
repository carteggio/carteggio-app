"use client";

import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { uploadFoto, rimuoviFoto } from "./actions";
import { FOTO_MAX_BYTES, FOTO_MIME_VALIDI } from "@/lib/foto";

const initialState = { error: null as string | null };

export default function FotoForm({ fotoUrl }: { fotoUrl: string | null }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!FOTO_MIME_VALIDI.includes(file.type)) {
      setError("Formato non valido. Usa JPG, PNG o WebP.");
      e.target.value = "";
      return;
    }

    if (file.size > FOTO_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setError(`Foto troppo grande (${mb} MB). Massimo 5 MB.`);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  }

  async function getCroppedBlob(): Promise<Blob | null> {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
    });

    // Per qualità: dimensione output max 1024x1024
    const outputSize = Math.min(1024, croppedAreaPixels.width);

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize
    );

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  }

  async function handleUpload() {
    setError(null);
    setLoading(true);

    try {
      const blob = await getCroppedBlob();
      if (!blob) {
        setError("Errore durante il ritaglio. Riprova.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("foto", blob, "profilo.jpg");

      const result = await uploadFoto(initialState, formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // Su successo, l'action fa redirect — non torniamo qui
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore imprevisto.");
      setLoading(false);
    }
  }

  function reset() {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
  }

  return (
    <div className="space-y-8">
      {/* Foto attuale (se presente e nessuna nuova foto in corso) */}
      {fotoUrl && !imageSrc && (
        <div className="text-center">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
            la tua foto attuale
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoUrl}
            alt="La tua foto profilo"
            className="w-48 h-48 object-cover rounded-full border border-rule mx-auto"
          />
          <form action={rimuoviFoto} className="mt-6">
            <button
              type="submit"
              className="font-sans text-xs tracking-widest uppercase text-ink-faded hover:text-accent transition-colors border border-rule rounded-full px-5 py-2"
            >
              rimuovi foto
            </button>
          </form>
        </div>
      )}

      {/* Selezione file (se nessuna foto in corso) */}
      {!imageSrc && (
        <label
          htmlFor="foto-input"
          className="block w-full text-center cursor-pointer border-2 border-dashed border-rule rounded-lg p-6 hover:border-accent transition-colors"
        >
          <input
            id="foto-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="font-sans text-sm tracking-widest uppercase text-ink-faded">
            {fotoUrl ? "scegli una nuova foto" : "scegli una foto"}
          </span>
          <p className="font-serif italic text-xs text-ink-faded mt-2">
            JPG, PNG o WebP · massimo 5 MB
          </p>
        </label>
      )}

      {error && !imageSrc && (
        <p className="font-serif italic text-sm text-accent text-center">
          {error}
        </p>
      )}

      {/* Cropper attivo */}
      {imageSrc && (
        <div className="space-y-4">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded text-center">
            sposta e ingrandisci per centrare il viso
          </p>

          <div className="relative w-full h-80 bg-ink rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          </div>

          <div>
            <label
              htmlFor="zoom"
              className="block font-sans text-xs tracking-widest uppercase text-ink-faded font-semibold mb-2"
            >
              zoom
            </label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#7a2e2a] cursor-pointer"
            />
          </div>

          {error && (
            <p className="font-serif italic text-sm text-accent text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="flex-1 font-sans text-sm tracking-widest uppercase text-ink-faded border border-rule rounded-lg px-5 py-3 hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
            >
              annulla
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !croppedAreaPixels}
              className="flex-1 bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
            >
              {loading ? "salvo…" : "carica foto"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
