"use client";

import { useState, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { uploadFoto, rimuoviFoto } from "./actions";
import { FOTO_MAX_BYTES, FOTO_MIME_VALIDI } from "@/lib/foto";

type State = { error: string | null };
const initialState: State = { error: null };

function SubmitButton({ canSubmit, label }: { canSubmit: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!canSubmit || pending}
      className="w-full bg-ink text-paper rounded-lg py-3 font-sans text-sm tracking-widest uppercase font-medium hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending ? "salvo…" : label}
    </button>
  );
}

export default function FotoForm({ fotoUrl }: { fotoUrl: string | null }) {
  const [uploadState, uploadAction] = useFormState(uploadFoto, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setHasFile(false);
      setPreviewUrl(null);
      return;
    }

    if (!FOTO_MIME_VALIDI.includes(file.type)) {
      setFileError("Formato non valido. Usa JPG, PNG o WebP.");
      setHasFile(false);
      setPreviewUrl(null);
      e.target.value = "";
      return;
    }

    if (file.size > FOTO_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      setFileError(`Foto troppo grande (${mb} MB). Massimo 5 MB.`);
      setHasFile(false);
      setPreviewUrl(null);
      e.target.value = "";
      return;
    }

    setHasFile(true);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-8">
      {/* Foto attuale */}
      {fotoUrl && !previewUrl && (
        <div className="text-center">
          <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
            la tua foto attuale
          </p>
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoUrl}
              alt="La tua foto profilo"
              className="w-48 h-48 object-cover rounded-lg border border-rule"
            />
          </div>

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

      {/* Form di upload */}
      <form action={uploadAction} className="space-y-4">
        {previewUrl && (
          <div className="text-center">
            <p className="font-sans text-xs tracking-widest uppercase text-ink-faded mb-3">
              anteprima
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Anteprima"
              className="w-48 h-48 object-cover rounded-lg border border-accent mx-auto"
            />
          </div>
        )}

        <label
          htmlFor="foto"
          className="block w-full text-center cursor-pointer border-2 border-dashed border-rule rounded-lg p-6 hover:border-accent transition-colors"
        >
          <input
            ref={fileInputRef}
            id="foto"
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="font-sans text-sm tracking-widest uppercase text-ink-faded">
            {fotoUrl
              ? hasFile
                ? "cambia foto selezionata"
                : "scegli una nuova foto"
              : hasFile
                ? "foto selezionata"
                : "scegli una foto"}
          </span>
          <p className="font-serif italic text-xs text-ink-faded mt-2">
            JPG, PNG o WebP · massimo 5 MB
          </p>
        </label>

        {fileError && (
          <p className="font-serif italic text-sm text-accent text-center">
            {fileError}
          </p>
        )}

        {uploadState.error && (
          <p className="font-serif italic text-sm text-accent text-center">
            {uploadState.error}
          </p>
        )}

        <SubmitButton
          canSubmit={hasFile && !fileError}
          label={fotoUrl ? "sostituisci foto" : "carica foto"}
        />
      </form>
    </div>
  );
}
